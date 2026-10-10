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
import { Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WsException } from '@nestjs/websockets';
import { Ticket } from '../entities/ticket.entity';
import { SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor, SocketIdentity, socketStaff, socketRoom } from '../../../core/auth/socket/socket-identity';
import { createWebSocketOriginValidator } from '../../../core/http/websocket-cors-policy';

/**
 * Ticket Notifications Gateway
 * Handles real-time notifications for ticket updates via WebSocket
 */
@UseGuards(SocketAuthGuard)
@UseInterceptors(SocketTenantInterceptor)
@WebSocketGateway({
  cors: {
    origin: createWebSocketOriginValidator(),
    credentials: true,
  },
  namespace: 'tickets',
})
export class TicketNotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TicketNotificationsGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs

  constructor(private readonly identities: SocketIdentityService, @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>) {}

  private emitRoom(room: string, event: string, payload: unknown) {
    return this.identities.emitRoom(this.server, room, event, payload, async (identity, id, kind) => {
      const ticketId = kind === 'ticket' ? id : (payload as { ticketId?: string })?.ticketId;
      if (!ticketId) return false;
      const staff = socketStaff(identity) || identity.roleNames.includes('editor');
      if ((payload as {message?: {isInternal?: boolean}})?.message?.isInternal && !staff) return false;
      const ticket = await this.tickets.findOne({ where: { id: ticketId, tenantId: identity.tenantId } });
      return !!ticket && (ticket.userId === identity.userId || ticket.assignedToId === identity.userId || staff);
    });
  }

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      const { userId, tenantId } = await this.identities.verify(client);

      // Store user-socket mapping
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Store userId in socket data for later use
      client.data.userId = userId;

      // Join user-specific room
      await client.join(socketRoom(tenantId, 'user', userId));
      client.emit('connected', { userId });

      this.logger.log(`Client ${client.id} connected for user ${userId}`);
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.logger.log(`Client ${client.id} disconnected for user ${userId}`);
    }
  }

  /**
   * Subscribe to ticket updates
   */
  @SubscribeMessage('subscribe:ticket')
  async handleSubscribeToTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() ticketId: string,
  ) {
    const identity = client.data.identity as SocketIdentity;
    if (typeof ticketId !== 'string' || !ticketId) throw new WsException('Invalid ticket');
    const ticket = await this.tickets.findOne({ where: { id: ticketId, tenantId: identity.tenantId } });
    if (!ticket || ticket.tenantId !== identity.tenantId || (ticket.userId !== identity.userId && ticket.assignedToId !== identity.userId && !socketStaff(identity) && !identity.roleNames.includes('editor'))) throw new WsException('Access denied');
    await client.join(socketRoom(identity.tenantId, 'ticket', ticketId));
    this.logger.log(`Client ${client.id} subscribed to ticket ${ticketId}`);
    return { success: true, ticketId };
  }

  /**
   * Unsubscribe from ticket updates
   */
  @SubscribeMessage('unsubscribe:ticket')
  handleUnsubscribeFromTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() ticketId: string,
  ) {
    client.leave(socketRoom(client.data.tenantId, 'ticket', ticketId));
    this.logger.log(`Client ${client.id} unsubscribed from ticket ${ticketId}`);
    return { success: true, ticketId };
  }

  /**
   * Emit ticket created notification
   */
  async emitTicketCreated(ticketId: string, userId: string, ticket: any) {
    const tenantId = await this.ticketTenant(ticketId);
    if (!tenantId) return;
    await this.emitRoom(socketRoom(tenantId, 'user', userId), 'ticket:created', {
      ticketId,
      ticket,
      timestamp: new Date(),
    });
    this.logger.log(`Emitted ticket:created for ticket ${ticketId} to user ${userId}`);
  }

  /**
   * Emit ticket assigned notification
   */
  async emitTicketAssigned(ticketId: string, assignedToId: string, ticket: any) {
    const tenantId = await this.ticketTenant(ticketId);
    if (!tenantId) return;
    await this.emitRoom(socketRoom(tenantId, 'user', assignedToId), 'ticket:assigned', {
      ticketId,
      ticket,
      timestamp: new Date(),
    });
    this.logger.log(`Emitted ticket:assigned for ticket ${ticketId} to user ${assignedToId}`);
  }

  /**
   * Emit new message notification
   */
  async emitNewMessage(ticketId: string, message: any, recipientUserIds: string[]) {
    const tenantId = await this.ticketTenant(ticketId);
    if (!tenantId) return;
    // Emit to ticket room
    await this.emitRoom(socketRoom(tenantId, 'ticket', ticketId), 'ticket:message', {
      ticketId,
      message,
      timestamp: new Date(),
    });

    // Emit to specific users
    for (const userId of recipientUserIds) {
      await this.emitRoom(socketRoom(tenantId, 'user', userId), 'ticket:message', {
        ticketId,
        message,
        timestamp: new Date(),
      });
    }

    this.logger.log(`Emitted ticket:message for ticket ${ticketId}`);
  }

  /**
   * Emit ticket status changed notification
   */
  async emitStatusChanged(ticketId: string, oldStatus: string, newStatus: string, userIds: string[]) {
    const tenantId = await this.ticketTenant(ticketId);
    if (!tenantId) return;
    const payload = {
      ticketId,
      oldStatus,
      newStatus,
      timestamp: new Date(),
    };

    // Emit to ticket room
    await this.emitRoom(socketRoom(tenantId, 'ticket', ticketId), 'ticket:status_changed', payload);

    // Emit to specific users
    for (const userId of userIds) {
      await this.emitRoom(socketRoom(tenantId, 'user', userId), 'ticket:status_changed', payload);
    }

    this.logger.log(`Emitted ticket:status_changed for ticket ${ticketId}`);
  }

  /**
   * Emit SLA breach warning
   */
  async emitSLABreachWarning(ticketId: string, assignedToId: string, ticket: any) {
    const tenantId = await this.ticketTenant(ticketId);
    if (!tenantId) return;
    await this.emitRoom(socketRoom(tenantId, 'user', assignedToId), 'ticket:sla_warning', {
      ticketId,
      ticket,
      timestamp: new Date(),
    });
    this.logger.log(`Emitted ticket:sla_warning for ticket ${ticketId} to user ${assignedToId}`);
  }

  /**
   * Emit SLA breach alert
   */
  async emitSLABreach(ticketId: string, userIds: string[], ticket: any) {
    const tenantId = await this.ticketTenant(ticketId);
    if (!tenantId) return;
    const payload = {
      ticketId,
      ticket,
      timestamp: new Date(),
    };

    for (const userId of userIds) {
      await this.emitRoom(socketRoom(tenantId, 'user', userId), 'ticket:sla_breach', payload);
    }

    this.logger.log(`Emitted ticket:sla_breach for ticket ${ticketId}`);
  }

  /**
   * Emit ticket escalated notification
   */
  async emitTicketEscalated(ticketId: string, escalatedToIds: string[], ticket: any) {
    const tenantId = await this.ticketTenant(ticketId);
    if (!tenantId) return;
    const payload = {
      ticketId,
      ticket,
      timestamp: new Date(),
    };

    for (const userId of escalatedToIds) {
      await this.emitRoom(socketRoom(tenantId, 'user', userId), 'ticket:escalated', payload);
    }

    this.logger.log(`Emitted ticket:escalated for ticket ${ticketId}`);
  }

  /**
   * Emit message edited notification
   */
  async emitMessageEdited(ticketId: string, messageId: string, userIds: string[]) {
    const tenantId = await this.ticketTenant(ticketId);
    if (!tenantId) return;
    const payload = {
      ticketId,
      messageId,
      timestamp: new Date(),
    };

    // Emit to ticket room
    await this.emitRoom(socketRoom(tenantId, 'ticket', ticketId), 'ticket:message_edited', payload);

    // Emit to specific users
    for (const userId of userIds) {
      await this.emitRoom(socketRoom(tenantId, 'user', userId), 'ticket:message_edited', payload);
    }

    this.logger.log(`Emitted ticket:message_edited for message ${messageId}`);
  }

  /**
   * Emit message deleted notification
   */
  async emitMessageDeleted(ticketId: string, messageId: string, userIds: string[]) {
    const tenantId = await this.ticketTenant(ticketId);
    if (!tenantId) return;
    const payload = {
      ticketId,
      messageId,
      timestamp: new Date(),
    };

    // Emit to ticket room
    await this.emitRoom(socketRoom(tenantId, 'ticket', ticketId), 'ticket:message_deleted', payload);

    // Emit to specific users
    for (const userId of userIds) {
      await this.emitRoom(socketRoom(tenantId, 'user', userId), 'ticket:message_deleted', payload);
    }

    this.logger.log(`Emitted ticket:message_deleted for message ${messageId}`);
  }

  private async ticketTenant(ticketId: string): Promise<string | undefined> {
    try { return (await this.tickets.findOne({ where: { id: ticketId }, select: ['tenantId'] }))?.tenantId; }
    catch { this.logger.warn('Ticket notification skipped: tenant could not be resolved'); return undefined; }
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get user's active socket count
   */
  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }
}
