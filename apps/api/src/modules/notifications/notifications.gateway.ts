import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.debug(`Socket client ${client.id} disconnected: No token`);
        client.disconnect();
        return;
      }

      const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_must_be_changed_in_production_environment_32chars!';
      const decoded = jwt.verify(token, jwtSecret) as any;

      if (!decoded || !decoded.userId) {
        client.disconnect();
        return;
      }

      // Attach user data to client socket
      client.data.user = decoded;

      // Join user-specific room and role-specific room
      const userRoom = `user:${decoded.userId}`;
      const roleRoom = `role:${decoded.societyId}:${decoded.role}`;

      client.join(userRoom);
      client.join(roleRoom);

      this.logger.debug(`Client ${client.id} joined rooms: [${userRoom}], [${roleRoom}]`);
    } catch (err: any) {
      this.logger.debug(`Socket auth failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join_grievance')
  handleJoinGrievance(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { grievanceId: string }
  ) {
    if (data?.grievanceId) {
      client.join(`grievance:${data.grievanceId}`);
      this.logger.debug(`Client ${client.id} joined room [grievance:${data.grievanceId}]`);
    }
  }

  @SubscribeMessage('join_society')
  handleJoinSociety(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { societyId: string }
  ) {
    if (data?.societyId) {
      client.join(`society:${data.societyId}`);
      this.logger.debug(`Client ${client.id} joined room [society:${data.societyId}]`);
    }
  }

  private lastStatsTickMap = new Map<string, number>();

  /**
   * Emit a throttled stats.tick event (max one per 5 seconds per society).
   */
  emitStatsTick(societyId: string) {
    if (!this.server) return;

    const now = Date.now();
    const lastTick = this.lastStatsTickMap.get(societyId) || 0;
    if (now - lastTick < 5000) {
      // Throttle: ignore if within 5s
      return;
    }

    this.lastStatsTickMap.set(societyId, now);
    this.server.to(`society:${societyId}`).emit('stats.tick', {
      societyId,
      timestamp: new Date().toISOString(),
    });
  }

  emitToUser(userId: string, notification: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification.new', notification);
      this.server.to(`user:${userId}`).emit('notification', notification);
    }
  }

  emitToRole(societyId: string, role: string, notification: any) {
    if (this.server) {
      this.server.to(`role:${societyId}:${role}`).emit('notification.new', notification);
      this.server.to(`role:${societyId}:${role}`).emit('notification', notification);
    }
  }

  emitToGrievance(grievanceId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`grievance:${grievanceId}`).emit(event, payload);
    }
  }
}

