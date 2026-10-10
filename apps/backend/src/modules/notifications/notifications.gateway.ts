import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor, SocketIdentity, socketAdmin, socketRoom } from '../../core/auth/socket/socket-identity';
import { createWebSocketOriginValidator } from '../../core/http/websocket-cors-policy';

@UseGuards(SocketAuthGuard)
@UseInterceptors(SocketTenantInterceptor)
@WebSocketGateway({
  cors: {
    origin: createWebSocketOriginValidator(),
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly identities: SocketIdentityService) {}

  async handleConnection(client: Socket) {
    try {
      await this.identities.verify(client);
      client.emit('connected', { message: 'Connected to notification service' });
    } catch { client.disconnect(true); }
  }

  private authorize(client: Socket, data: { userId?: string; tenantId?: string }, admin = false): SocketIdentity {
    const identity = client.data.identity as SocketIdentity;
    if (!identity || data?.tenantId !== identity.tenantId || (!admin && data?.userId !== identity.userId) || (admin && !socketAdmin(identity))) {
      throw new WsException('Access denied');
    }
    return identity;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove user from connected users map
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: string; tenantId: string }, @ConnectedSocket() client: Socket) {
    this.authorize(client, data);
    if (!data.tenantId) {
      this.logger.warn(`Client ${client.id} tried to join room without tenantId`);
      return { error: 'tenantId is required' };
    }

    this.connectedUsers.set(data.userId, client.id);

    // Join user-specific room (scoped by tenant to be extra safe)
    const userRoom = socketRoom(data.tenantId, 'user', data.userId);
    client.join(userRoom);

    // Join tenant broadcase channel
    const tenantRoom = socketRoom(data.tenantId, 'tenant');
    client.join(tenantRoom);

    this.logger.log(`User ${data.userId} joined room ${userRoom} and ${tenantRoom}`);

    client.emit('joined', { message: `Joined rooms for user ${data.userId} in tenant ${data.tenantId}` });
    return { success: true };
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() data: { userId: string; tenantId: string }, @ConnectedSocket() client: Socket) {
    this.authorize(client, data);
    this.connectedUsers.delete(data.userId);

    if (data.tenantId) {
      client.leave(socketRoom(data.tenantId, 'user', data.userId));
      client.leave(socketRoom(data.tenantId, 'tenant'));
      this.logger.log(`User ${data.userId} left tenant ${data.tenantId} rooms`);
    }

    client.emit('left', { message: `Left rooms for user ${data.userId}` });
  }

  // Method to send notification to a specific user
  async sendNotificationToUser(tenantId: string, userId: string, notification: any) {
    const userRoom = socketRoom(tenantId, 'user', userId);
    await this.identities.emitRoom(this.server, userRoom, 'notification', notification);
    this.logger.log(`Notification sent to user ${userId} in tenant ${tenantId}`);
  }

  // Method to send notification to all users in a tenant
  async sendNotificationToTenant(tenantId: string, notification: any) {
    await this.identities.emitRoom(this.server, socketRoom(tenantId, 'tenant'), 'notification', notification);
    this.logger.log(`Notification sent to all users in tenant ${tenantId}`);
  }

  // DEPRECATED: Global broadcast is dangerous in multi-tenant env
  // Replacing with tenant-aware broadcast
  async sendNotificationToAll(notification: any) {
    this.logger.warn('Use sendNotificationToTenant instead of sendNotificationToAll');
    // this.server.emit('notification', notification); 
  }

  // Method to send notification to admins of a tenant
  async sendNotificationToTenantAdmins(tenantId: string, notification: any) {
    await this.identities.emitRoom(this.server, socketRoom(tenantId, 'admins'), 'admin-notification', notification);
    this.logger.log(`Notification sent to admins of tenant ${tenantId}`);
  }

  // DEPRECATED: Global admin broadcast
  async sendNotificationToAdmins(notification: any) {
    this.logger.warn('Use sendNotificationToTenantAdmins instead');
    // await this.identities.emitRoom(this.server, 'admins', 'admin-notification', notification);
  }

  @SubscribeMessage('join-admins')
  handleJoinAdmins(@MessageBody() data: { tenantId: string }, @ConnectedSocket() client: Socket) {
    this.authorize(client, data, true);
    if (data && data.tenantId) {
      client.join(socketRoom(data.tenantId, 'admins'));
      this.logger.log(`Client ${client.id} joined admins-${data.tenantId} room`);
      client.emit('joined-admins', { message: `Joined admins-${data.tenantId} room` });
      return { success: true };
    } else {
      // Fallback for legacy calls (should be updated on client)
      // client.join('admins'); 
      this.logger.warn(`Client ${client.id} tried to join admins room without tenantId`);
    }
  }

  @SubscribeMessage('send-notification')
  async handleSendNotification(@MessageBody() data: { userId?: string, tenantId: string, message: string, type: string }, @ConnectedSocket() client: Socket) {
    this.authorize(client, data, true);
    if (!data.tenantId) {
      this.logger.warn('Client tried to send notification without tenantId');
      return { success: false, error: 'tenantId is required' };
    }

    const notification = {
      id: Date.now().toString(),
      message: data.message,
      type: data.type,
      tenantId: data.tenantId, // Store tenantId in notification object
      timestamp: new Date(),
    };

    if (data.userId) {
      await this.sendNotificationToUser(data.tenantId, data.userId, notification);
    } else {
      // Send to the entire tenant broadcase room
      await this.sendNotificationToTenant(data.tenantId, notification);
    }

    return { success: true, notification };
  }
}
