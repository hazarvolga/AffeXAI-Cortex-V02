import { SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor } from '../../core/auth/socket/socket-identity';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { io, Socket } from 'socket.io-client';
import { NotificationsGateway } from './notifications.gateway';
import { UsersService } from '../users/users.service';
import { TenantModule } from '../../core/tenant/tenant.module';
jest.mock('../users/users.service', () => ({ UsersService: class {} }));

describe('Notifications socket identity and room boundary', () => {
 let app:INestApplication;let jwt:JwtService;let gateway:NotificationsGateway;let url:string;let sockets:Socket[]=[];
 const users=new Map<string,{id:string;tenantId:string;tokenVersion:number;isActive:boolean;roleNames:string[]}>();
 beforeAll(async()=>{
  const module=await Test.createTestingModule({imports:[JwtModule.register({secret:'isolated-test-key-with-enough-entropy-123456'}),TenantModule],providers:[SocketIdentityService,SocketAuthGuard,SocketTenantInterceptor,NotificationsGateway,{provide:UsersService,useValue:{findOne:async(id:string)=>users.get(id)}}]}).compile(); // gitleaks:allow -- test-only signing key
  app=module.createNestApplication();await app.listen(0,'127.0.0.1');url=await app.getUrl();jwt=module.get(JwtService);gateway=module.get(NotificationsGateway);
 });
 beforeEach(()=>{users.set('a',{id:'a',tenantId:'tenant-a',tokenVersion:1,isActive:true,roleNames:['viewer']});users.set('b',{id:'b',tenantId:'tenant-b',tokenVersion:1,isActive:true,roleNames:['admin']});});
 afterEach(()=>{sockets.forEach(socket=>socket.disconnect());sockets=[];});afterAll(async()=>{await app.close();});
 function token(id:string,type='access'){return jwt.sign({sub:id,type,tokenVersion:1,tenantId:users.get(id)?.tenantId});}
 async function connect(value?:string){const socket=io(url,{transports:['websocket'],reconnection:false,autoConnect:false,auth:{token:value}});sockets.push(socket);const outcome=new Promise<boolean>((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('connection outcome timed out')),2000);socket.once('connected',()=>{clearTimeout(timeout);resolve(true);});socket.once('disconnect',()=>{clearTimeout(timeout);resolve(false);});});socket.connect();return {socket,accepted:await outcome};}
 async function action(socket:Socket,event:string,data:object){return new Promise<{success?:boolean;error?:unknown}>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('action timed out')),2000);const done=(result:{success?:boolean;error?:unknown})=>{clearTimeout(timer);socket.off('exception',failure);socket.off('disconnect',disconnected);resolve(result);};const failure=(error:unknown)=>done({error});const disconnected=()=>done({error:'disconnected'});socket.once('exception',failure);socket.once('disconnect',disconnected);socket.emit(event,data,done);});}
 it('rejects missing and refresh-purpose tokens at connection',async()=>{expect((await connect()).accepted).toBe(false);expect((await connect(token('a','refresh'))).accepted).toBe(false);});
 it('rejects inactive and wrong-version identities',async()=>{users.get('a')!.isActive=false;expect((await connect(token('a'))).accepted).toBe(false);users.get('a')!.isActive=true;users.get('a')!.tokenVersion=2;expect((await connect(token('a'))).accepted).toBe(false);});
 it('cannot join another user or tenant room',async()=>{const {socket}=await connect(token('a'));expect((await action(socket,'join',{userId:'b',tenantId:'tenant-b'})).success).not.toBe(true);});
 it('viewer cannot join admin rooms or emit tenant notifications',async()=>{const {socket}=await connect(token('a'));expect((await action(socket,'join-admins',{tenantId:'tenant-a'})).success).not.toBe(true);expect((await action(socket,'send-notification',{tenantId:'tenant-b',message:'forged',type:'info'})).success).not.toBe(true);});
 it('delivers only within the verified tenant and revokes on next action',async()=>{
  const a=await connect(token('a'));const b=await connect(token('b'));expect(a.accepted&&b.accepted).toBe(true);
  expect((await action(a.socket,'join',{userId:'a',tenantId:'tenant-a'})).success).toBe(true);expect((await action(b.socket,'join',{userId:'b',tenantId:'tenant-b'})).success).toBe(true);
  const received:unknown[]=[];b.socket.on('notification',data=>received.push(data));const delivered=new Promise(resolve=>a.socket.once('notification',resolve));await gateway.sendNotificationToTenant('tenant-a',{message:'only-a'});expect(await delivered).toEqual({message:'only-a'});
  users.get('a')!.tokenVersion=2;expect((await action(a.socket,'join',{userId:'a',tenantId:'tenant-a'})).success).not.toBe(true);expect(received).toEqual([]);
 });
 it('does not deliver a passive push after credential revocation',async()=>{
  const {socket}=await connect(token('a'));await action(socket,'join',{userId:'a',tenantId:'tenant-a'});
  const received:unknown[]=[];socket.on('notification',value=>received.push(value));users.get('a')!.tokenVersion=2;
  await gateway.sendNotificationToTenant('tenant-a',{message:'secret'});await new Promise(resolve=>setTimeout(resolve,30));expect(received).toEqual([]);
 });
 it('does not deliver admin pushes after passive role removal',async()=>{
  const {socket}=await connect(token('b'));await action(socket,'join-admins',{tenantId:'tenant-b'});
  const received:unknown[]=[];socket.on('admin-notification',value=>received.push(value));users.get('b')!.roleNames=['viewer'];
  await gateway.sendNotificationToTenantAdmins('tenant-b',{message:'admin-secret'});await new Promise(resolve=>setTimeout(resolve,30));expect(received).toEqual([]);
 });
 it('does not deliver pushes after the access token expires without an action',async()=>{
  const {socket}=await connect(jwt.sign({sub:'a',type:'access',tokenVersion:1},{expiresIn:1}));await action(socket,'join',{userId:'a',tenantId:'tenant-a'});
  const received:unknown[]=[];socket.on('notification',value=>received.push(value));await new Promise(resolve=>setTimeout(resolve,1100));
  await gateway.sendNotificationToTenant('tenant-a',{message:'expired-secret'});await new Promise(resolve=>setTimeout(resolve,30));expect(received).toEqual([]);
 });

});
