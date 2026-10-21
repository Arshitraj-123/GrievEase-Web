import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
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

  emitToUser(userId: string, notification: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification', notification);
    }
  }

  emitToRole(societyId: string, role: string, notification: any) {
    if (this.server) {
      this.server.to(`role:${societyId}:${role}`).emit('notification', notification);
    }
  }
}
