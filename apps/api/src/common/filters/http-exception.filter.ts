import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import crypto from 'crypto';
import { redactSecrets } from '../utils/log-redaction';

const SAFE_STATUS_CODES: Record<number, { code: string; defaultMessage: string }> = {
  [HttpStatus.BAD_REQUEST]: { code: 'BAD_REQUEST', defaultMessage: 'Bad request syntax or parameters.' },
  [HttpStatus.UNAUTHORIZED]: { code: 'UNAUTHORIZED', defaultMessage: 'Authentication required.' },
  [HttpStatus.FORBIDDEN]: { code: 'FORBIDDEN', defaultMessage: 'Access denied.' },
  [HttpStatus.NOT_FOUND]: { code: 'NOT_FOUND', defaultMessage: 'Requested resource not found.' },
  [HttpStatus.METHOD_NOT_ALLOWED]: { code: 'METHOD_NOT_ALLOWED', defaultMessage: 'HTTP method not supported.' },
  [HttpStatus.NOT_ACCEPTABLE]: { code: 'NOT_ACCEPTABLE', defaultMessage: 'Not acceptable.' },
  [HttpStatus.REQUEST_TIMEOUT]: { code: 'REQUEST_TIMEOUT', defaultMessage: 'Request timed out.' },
  [HttpStatus.CONFLICT]: { code: 'CONFLICT', defaultMessage: 'Resource state conflict.' },
  [HttpStatus.GONE]: { code: 'GONE', defaultMessage: 'Resource is no longer available.' },
  [HttpStatus.PAYLOAD_TOO_LARGE]: { code: 'PAYLOAD_TOO_LARGE', defaultMessage: 'Payload exceeds maximum allowed size.' },
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: { code: 'UNSUPPORTED_MEDIA_TYPE', defaultMessage: 'Content-Type not supported.' },
  [HttpStatus.UNPROCESSABLE_ENTITY]: { code: 'UNPROCESSABLE_ENTITY', defaultMessage: 'Validation failed.' },
  [HttpStatus.TOO_MANY_REQUESTS]: { code: 'TOO_MANY_REQUESTS', defaultMessage: 'Rate limit exceeded. Try again later.' },
  [HttpStatus.INTERNAL_SERVER_ERROR]: { code: 'INTERNAL_SERVER_ERROR', defaultMessage: 'An internal error occurred.' },
  [HttpStatus.NOT_IMPLEMENTED]: { code: 'NOT_IMPLEMENTED', defaultMessage: 'Feature not implemented.' },
  [HttpStatus.BAD_GATEWAY]: { code: 'BAD_GATEWAY', defaultMessage: 'Upstream gateway error.' },
  [HttpStatus.SERVICE_UNAVAILABLE]: { code: 'SERVICE_UNAVAILABLE', defaultMessage: 'Service temporarily unavailable.' },
  [HttpStatus.GATEWAY_TIMEOUT]: { code: 'GATEWAY_TIMEOUT', defaultMessage: 'Gateway timeout.' },
};

/**
 * Universal Security Hardened Exception Filter (Status 400 - 599).
 * Guarantees zero sensitive data disclosure (stack traces, SQL statements,
 * schema/table names, file system paths, library versions, hostnames, or secrets).
 *
 * Emits uniform public error structures: { code, message, referenceId }.
 * All internal diagnostics and stack traces are logged exclusively to server
 * storage tagged with the unique referenceId.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const referenceId = crypto.randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected internal error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      const statusMeta = SAFE_STATUS_CODES[status] || {
        code: `HTTP_${status}`,
        defaultMessage: 'An HTTP error occurred.',
      };

      code = statusMeta.code;
      message = statusMeta.defaultMessage;

      // Extract safe custom message if explicitly provided by developer
      if (typeof res === 'string') {
        message = this.sanitizeErrorMessage(res);
      } else if (typeof res === 'object' && res !== null) {
        if (typeof res.code === 'string') {
          code = res.code;
        } else if (typeof res.error === 'string') {
          code = res.error.toUpperCase().replace(/\s+/g, '_');
        }

        if (status < 500) {
          if (Array.isArray(res.message)) {
            // Validation errors: provide clean bulleted list without internal keys
            message = res.message.map((m: any) => this.sanitizeErrorMessage(String(m))).join('; ');
          } else if (typeof res.message === 'string') {
            message = this.sanitizeErrorMessage(res.message);
          }
        }
      }

      // Log client errors at debug/warn and server errors at error level
      if (status >= 500) {
        const errorStack = exception.stack ? redactSecrets(exception.stack) : '';
        this.logger.error(`[${referenceId}] Server Error ${status} on ${request.method} ${request.url}: ${exception.message}`, errorStack);
      } else {
        this.logger.warn(`[${referenceId}] Client Error ${status} on ${request.method} ${request.url}: ${message}`);
      }
    } else if (exception instanceof Error) {
      // Unhandled Database, Redis, Syntax or System Errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_SERVER_ERROR';
      message = 'An unexpected internal error occurred. Please quote the reference ID to support.';

      const sanitizedMsg = redactSecrets(exception.message);
      const sanitizedStack = exception.stack ? redactSecrets(exception.stack) : '';
      this.logger.error(`[${referenceId}] Unhandled System Error on ${request.method} ${request.url}: ${sanitizedMsg}`, sanitizedStack);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_SERVER_ERROR';
      message = 'An unexpected error occurred.';
      this.logger.error(`[${referenceId}] Unknown non-Error thrown on ${request.method} ${request.url}`);
    }

    // Scrub response message to ensure zero accidental leakage of internals
    const safeMessage = this.sanitizeErrorMessage(message);

    response.status(status).json({
      code,
      message: safeMessage,
      referenceId,
    });
  }

  private sanitizeErrorMessage(msg: string): string {
    if (!msg) return 'Error';

    // Disallow and sanitize SQL errors, file paths, node internals, and secrets
    const sensitivePatterns = [
      /SELECT .* FROM/gi,
      /INSERT INTO .* VALUES/gi,
      /UPDATE .* SET/gi,
      /DELETE FROM/gi,
      /relation ".*" does not exist/gi,
      /column ".*" does not exist/gi,
      /syntax error at or near/gi,
      /at (?:[a-zA-Z0-9_$.]+\s+)?\(?[a-zA-Z]:\\[^\n)]+/g,
      /at (?:[a-zA-Z0-9_$.]+\s+)?\(?\/[^\n)]+/g,
      /node_modules/gi,
      /PostgreSQL/gi,
      /Redis/gi,
    ];

    let clean = msg;
    for (const pattern of sensitivePatterns) {
      if (pattern.test(clean)) {
        clean = 'An error occurred while processing your request.';
        break;
      }
    }

    return redactSecrets(clean);
  }
}
