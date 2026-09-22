import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'barber_secret',
      });
      const userId = payload.sub as string;
      if (!userId) {
        client.disconnect();
        return;
      }
      (client as any).userId = userId;
      (client as any).user = payload;
      await client.join(this.room(userId));
      this.logger.log(`user ${userId} connected ${client.id}`);
      client.emit('connected', { userId });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) this.logger.log(`user ${userId} disconnected ${client.id}`);
  }

  pushToUser(userId: string, notification: Notification) {
    if (!this.server) return;
    this.server.to(this.room(userId)).emit('notification', notification);
  }

  private room(userId: string) {
    return `user:${userId}`;
  }

  private extractToken(client: Socket): string | null {
    const auth = (client.handshake.auth as any)?.token;
    if (auth) return String(auth).replace(/^Bearer\s+/i, '');
    const header = client.handshake.headers.authorization;
    if (header) return header.replace(/^Bearer\s+/i, '');
    const query = (client.handshake.query as any)?.token;
    if (query) return String(query).replace(/^Bearer\s+/i, '');
    return null;
  }
}
