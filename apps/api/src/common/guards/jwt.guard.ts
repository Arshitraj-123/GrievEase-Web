import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { pool } from '../../database/db';
import { UserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class JwtGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token required');
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_must_be_changed_in_production_environment_32chars!';
      const decoded = jwt.verify(token, jwtSecret) as any;

      if (!decoded || !decoded.userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Check session active in database
      if (decoded.sessionId) {
        const sessionRes = await pool.query(`
          SELECT revoked_at, expires_at, last_seen_at FROM device_session
          WHERE id = $1;
        `, [decoded.sessionId]);

        if (sessionRes.rows.length === 0 || sessionRes.rows[0].revoked_at) {
          throw new UnauthorizedException('Session has been revoked');
        }

        const now = new Date();
        if (new Date(sessionRes.rows[0].expires_at) < now) {
          throw new UnauthorizedException('Session has expired');
        }

        // Inactivity timeout: 15 minutes
        const lastSeen = new Date(sessionRes.rows[0].last_seen_at);
        const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
        if (diffMinutes > 15) {
          await pool.query(`UPDATE device_session SET revoked_at = NOW() WHERE id = $1;`, [decoded.sessionId]);
          throw new UnauthorizedException('Session terminated due to 15-minute inactivity');
        }

        // Update last seen
        await pool.query(`UPDATE device_session SET last_seen_at = NOW() WHERE id = $1;`, [decoded.sessionId]);
      }

      const userPayload: UserPayload = {
        userId: decoded.userId,
        societyId: decoded.societyId,
        role: decoded.role,
        username: decoded.username,
        sessionId: decoded.sessionId,
        isSuperAdmin: decoded.role === 'SUPER_ADMIN',
        stepUpExpiresAt: decoded.stepUpExpiresAt,
      };

      request.user = userPayload;
      return true;
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Invalid or expired session');
    }
  }

  private extractToken(request: any): string | null {
    if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
      return request.headers.authorization.substring(7);
    }
    if (request.cookies && request.cookies.access_token) {
      return request.cookies.access_token;
    }
    return null;
  }
}
