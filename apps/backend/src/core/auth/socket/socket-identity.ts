import { CallHandler, CanActivate, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket, Server, Namespace } from 'socket.io';
import { Observable } from 'rxjs';
import { UsersService } from '../../../modules/users/users.service';
import { TenantService } from '../../tenant/tenant.service';
import { isConfiguredPlatformAdmin } from '../platform-admin.policy';

export interface SocketIdentity { userId: string; tenantId: string; roleNames: readonly string[]; isPlatformAdmin: boolean; }
export function socketRoom(tenantId: string, kind: string, id = ''): string {
  return JSON.stringify([tenantId, kind, id]);
}
export function socketStaff(identity: SocketIdentity): boolean {
  return identity.isPlatformAdmin || identity.roleNames.some(role => ['admin', 'support', 'support_manager', 'support_agent'].includes(role));
}
export function socketAdmin(identity: SocketIdentity): boolean {
  return identity.isPlatformAdmin || identity.roleNames.includes('admin');
}
@Injectable()
export class SocketIdentityService {
  private readonly deliveries = new WeakMap<Socket, Promise<void>>();

  /** Serialize delivery per connection; re-check identity and resource access at delivery time. */
  async emitRoom(server: Server | Namespace, room: string, event: string, payload: unknown,
    authorize?: (identity: SocketIdentity, resourceId: string, kind: string) => Promise<boolean>, excludedId?: string): Promise<void> {
    const namespace = 'of' in server ? server.of('/') : server;
    const [tenantId, kind, resourceId] = JSON.parse(room) as string[];
    await Promise.all([...namespace.sockets.values()].filter(client => client.id !== excludedId && client.rooms.has(room)).map(client => {
      const delivery = (this.deliveries.get(client) ?? Promise.resolve()).then(async () => {
        if (!client.connected || !client.rooms.has(room)) return;
        try {
          const identity = await this.verify(client);
          const allowed = identity.tenantId === tenantId
            && (kind !== 'user' || identity.userId === resourceId)
            && (kind !== 'admins' || socketAdmin(identity))
            && (kind !== 'staff' || socketStaff(identity))
            && (!authorize || await authorize(identity, resourceId, kind));
          if (!allowed) return;
          client.emit(event, payload);
        } catch { client.disconnect(true); }
      });
      this.deliveries.set(client, delivery);
      return delivery;
    }));
  }

  constructor(private readonly jwt: JwtService, private readonly modules: ModuleRef) {}
  async verify(client: Socket): Promise<SocketIdentity> {
    const authorization = client.handshake.headers.authorization;
    const token = client.handshake.auth?.token ?? (authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined);
    if (typeof token !== 'string' || !token) throw new WsException('Authentication required');
    const claims = await this.jwt.verifyAsync<{ sub?: string; type?: string; tokenVersion?: number }>(token);
    if (claims.type !== 'access' || typeof claims.sub !== 'string' || !Number.isInteger(claims.tokenVersion) || claims.tokenVersion < 1) throw new WsException('Invalid access token');
    const users = this.modules.get(UsersService, { strict: false });
    const user = await users.findOne(claims.sub, undefined, true);
    if (!user?.isActive || user.deletedAt || !user.tenantId || claims.tokenVersion !== user.tokenVersion) throw new WsException('Identity revoked');
    const hint = client.handshake.headers['x-tenant-id'] ?? client.handshake.auth?.tenantId;
    if (hint !== undefined && hint !== user.tenantId) throw new WsException('Tenant mismatch');
    const identity: SocketIdentity = Object.freeze({ userId: user.id, tenantId: user.tenantId,
      roleNames: Object.freeze((user.roleNames || []).map(role => role.toLowerCase())), isPlatformAdmin: isConfiguredPlatformAdmin(user.id) });
    client.data.identity = identity;
    client.data.userId = identity.userId;
    client.data.tenantId = identity.tenantId;
    client.data.role = socketStaff(identity) ? 'support' : 'user';
    return identity;
  }
}
@Injectable()
export class SocketAuthGuard implements CanActivate {
  constructor(private readonly identities: SocketIdentityService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    try { await this.identities.verify(client); return true; }
    catch { client.emit('exception', { status: 'error', message: 'Authentication required' }); client.disconnect(true); return false; }
  }
}
@Injectable()
export class SocketTenantInterceptor implements NestInterceptor {
  constructor(private readonly tenants: TenantService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const identity = context.switchToWs().getClient<Socket>().data.identity as SocketIdentity | undefined;
    if (!identity) throw new WsException('Authentication required');
    return new Observable(subscriber => this.tenants.runWithTenant({ tenantId: identity.tenantId, source: 'authenticated' }, () => next.handle().subscribe(subscriber)));
  }
}
