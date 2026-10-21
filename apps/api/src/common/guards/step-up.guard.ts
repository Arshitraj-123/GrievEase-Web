import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_STEP_UP_KEY } from '../decorators/require-step-up.decorator';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isStepUpRequired = this.reflector.getAllAndOverride<boolean>(REQUIRE_STEP_UP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isStepUpRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check stepUp token in header or cookie
    const stepUpToken = request.headers['x-step-up-token'] || request.cookies?.step_up_token;

    if (!stepUpToken) {
      throw new ForbiddenException({
        code: 'STEP_UP_REQUIRED',
        message: 'Step-up authentication required. Please re-enter your password and TOTP code to proceed.',
      });
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_must_be_changed_in_production_environment_32chars!';
      const decoded = jwt.verify(stepUpToken, jwtSecret) as any;

      if (!decoded.stepUp || decoded.userId !== user.userId) {
        throw new ForbiddenException('Invalid step-up token');
      }

      return true;
    } catch {
      throw new ForbiddenException({
        code: 'STEP_UP_EXPIRED',
        message: 'Step-up authentication expired. Please re-authenticate.',
      });
    }
  }
}
