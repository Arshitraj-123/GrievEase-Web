import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  userId: string;
  societyId: string;
  role: string;
  username: string;
  flatId?: string;
  language?: string;
  sessionId?: string;
  isSuperAdmin?: boolean;
  stepUpExpiresAt?: number;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserPayload;
    return data ? user?.[data] : user;
  }
);
