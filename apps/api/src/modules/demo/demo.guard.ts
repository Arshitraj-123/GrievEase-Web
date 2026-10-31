import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class DemoSecurityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const isProd = process.env.NODE_ENV === 'production';
    const isDemoMode = process.env.DEMO_MODE === 'true';

    // 1. Strict production lockout: must return 404 in production or if demo mode is off
    if (isProd || !isDemoMode) {
      throw new NotFoundException('Cannot GET /demo');
    }

    const req = context.switchToHttp().getRequest<Request>();

    // 2. Localhost binding check
    const clientIp = req.ip || req.socket.remoteAddress || '';
    const isLocalhost =
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp === '::ffff:127.0.0.1' ||
      clientIp === 'localhost';

    if (!isLocalhost) {
      throw new NotFoundException('Cannot GET /demo');
    }

    // 3. Secret header verification
    const secretHeader = req.headers['x-demo-secret'];
    const expectedSecret = process.env.DEMO_SECRET || 'grievease_demo_secret_2026';

    if (!secretHeader || secretHeader !== expectedSecret) {
      throw new NotFoundException('Cannot GET /demo');
    }

    return true;
  }
}
