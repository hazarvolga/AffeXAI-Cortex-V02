import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TenantService } from '../../../core/tenant/tenant.service';
import { SocketIdentity, socketRoom, socketStaff } from '../../../core/auth/socket/socket-identity';
import { ChatSessionService } from '../services/chat-session.service';

@Injectable()
export class ChatSessionRooms {
  private readonly sessionTenants = new Map<string, string>();
  constructor(private readonly tenants: TenantService) {}
  remember(sessionId: string, tenantId: string) { this.sessionTenants.set(sessionId, tenantId); }
  room(sessionId: string): string {
    const tenantId = this.tenants.getTenantId() ?? this.sessionTenants.get(sessionId);
    return socketRoom(tenantId ?? 'unbound', 'chat', sessionId);
  }
  staffRoom(sessionId: string): string {
    const tenantId = this.tenants.getTenantId() ?? this.sessionTenants.get(sessionId);
    return socketRoom(tenantId ?? 'unbound', 'staff');
  }
}

@Injectable()
export class ChatSessionGuard implements CanActivate {
  constructor(private readonly sessions: ChatSessionService, private readonly tenants: TenantService, private readonly rooms: ChatSessionRooms) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const identity = context.switchToWs().getClient<Socket>().data.identity as SocketIdentity;
    const handler = context.getHandler().name;
    if (['handleHeartbeat', 'handlePing', 'handleGetConversationStarters', 'handleGetSuggestedTopics'].includes(handler)) return true;
    const data = context.switchToWs().getData<{ sessionId?: string }>();
    if (typeof data?.sessionId !== 'string' || !data.sessionId) throw new WsException('Invalid session');
    const staff = socketStaff(identity);
    if (['handleJoinSupport', 'handleLeaveSupport'].includes(handler) && !staff) throw new WsException('Support access required');
    return this.tenants.runWithTenant({ tenantId: identity.tenantId }, async () => {
      const session = await this.sessions.getSession(data.sessionId);
      if (!session || session.tenantId !== identity.tenantId || (session.userId !== identity.userId && !staff)) throw new WsException('Access denied');
      this.rooms.remember(data.sessionId, identity.tenantId);
      return true;
    });
  }
}
