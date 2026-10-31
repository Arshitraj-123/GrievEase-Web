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
    let message = 'An unexpected error occurred. Please quote the reference ID to your society administrator.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();

      if (status >= 500) {
        // Internal server errors mask details to protect architecture
        code = 'INTERNAL_SERVER_ERROR';
        message = 'An unexpected internal error occurred. Please quote the reference ID to your administrator.';
      } else {
        if (typeof res === 'string') {
          message = res;
        } else if (typeof res === 'object' && res !== null) {
          message = res.message || message;
          code = res.error || res.code || code;
        }
      }
    } else if (exception instanceof Error) {
      const sanitizedMsg = redactSecrets(exception.message);
      const sanitizedStack = redactSecrets(exception.stack);
      this.logger.error(`[${referenceId}] Unhandled Error on ${request.method} ${request.url}: ${sanitizedMsg}`, sanitizedStack);
    } else {
      this.logger.error(`[${referenceId}] Unknown non-Error thrown on ${request.method} ${request.url}`);
    }

    response.status(status).json({
      code,
      message,
      referenceId,
    });
  }
}
