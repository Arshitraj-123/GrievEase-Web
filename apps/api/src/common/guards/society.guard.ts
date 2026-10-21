import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SocietyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const requestedSocietyId =
      request.params.societyId || request.headers['x-society-id'] || request.body?.societyId;

    if (requestedSocietyId && requestedSocietyId !== user.societyId) {
      throw new ForbiddenException('Cross-society access is strictly prohibited');
    }

    return true;
  }
}
