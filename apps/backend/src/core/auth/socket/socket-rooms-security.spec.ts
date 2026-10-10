import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { io, Socket } from 'socket.io-client';
import { TicketNotificationsGateway } from '../../../modules/tickets/gateways/ticket-notifications.gateway';
import { Ticket } from '../../../modules/tickets/entities/ticket.entity';
import { ChatGateway } from '../../../modules/chat/gateways/chat.gateway';
import { ChatSessionGuard, ChatSessionRooms } from '../../../modules/chat/gateways/chat-session.guard';
import { ChatSessionService } from '../../../modules/chat/services/chat-session.service';
import { ChatMessageService } from '../../../modules/chat/services/chat-message.service';
import { GeneralCommunicationAiService } from '../../../modules/chat/services/general-communication-ai.service';
import { UsersService } from '../../../modules/users/users.service';
import { TenantModule } from '../../tenant/tenant.module';
import { TenantService } from '../../tenant/tenant.service';
import { SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor } from './socket-identity';
jest.mock('../../../modules/users/users.service',()=>({UsersService:class{}}));
jest.mock('../../../modules/chat/services/chat-session.service',()=>({ChatSessionService:class{}}));
jest.mock('../../../modules/chat/services/chat-message.service',()=>({ChatMessageService:class{}}));
jest.mock('../../../modules/chat/services/general-communication-ai.service',()=>({GeneralCommunicationAiService:class{}}));
describe('Chat/ticket real socket tenant rooms',()=>{
 let app:INestApplication;let jwt:JwtService;let url:string;let tenant:TenantService;let tickets:TicketNotificationsGateway;let chat:ChatGateway;let sockets:Socket[]=[];
 const users=new Map<string,{id:string;tenantId:string;tokenVersion:number;isActive:boolean;roleNames:string[]}>();
 const records=new Map([['ta',{id:'ta',tenantId:'a',userId:'ua'}],['tb',{id:'tb',tenantId:'b',userId:'ub'}]]);
 beforeAll(async()=>{
 const module=await Test.createTestingModule({imports:[JwtModule.register({secret:'isolated-socket-key-longer-than-thirty-two-characters'}),TenantModule],providers:[SocketIdentityService,SocketAuthGuard,SocketTenantInterceptor,ChatSessionRooms,ChatSessionGuard,ChatGateway,TicketNotificationsGateway,
 {provide:UsersService,useValue:{findOne:async(id:string)=>users.get(id)}},
 {provide:getRepositoryToken(Ticket),useValue:{findOne:async(options:{where:{id:string;tenantId?:string}})=>{const record=records.get(options.where.id);return record&&(!options.where.tenantId||record.tenantId===options.where.tenantId)?record:null;}}},
 {provide:ChatSessionService,useValue:{getSession:async(id:string)=>{const record=records.get(id);if(record?.tenantId!==tenant.getTenantId())throw new Error('Not found');return record;},validateSessionAccess:async(id:string,userId:string)=>{const record=records.get(id);return record?.tenantId===tenant.getTenantId()&&record.userId===userId;}}},
 {provide:ChatMessageService,useValue:{sendMessage:jest.fn()}},{provide:GeneralCommunicationAiService,useValue:{}}]}).compile();
 app=module.createNestApplication();await app.listen(0,'127.0.0.1');url=await app.getUrl();jwt=module.get(JwtService);tenant=module.get(TenantService);tickets=module.get(TicketNotificationsGateway);chat=module.get(ChatGateway);
 });
 beforeEach(()=>{for(const [id,t] of [['ua','a'],['ub','b'],['ua2','a']])users.set(id,{id,tenantId:t,tokenVersion:1,isActive:true,roleNames:['viewer']});});afterEach(()=>{sockets.forEach(s=>s.disconnect());sockets=[];});afterAll(async()=>{await app.close();});
 async function connect(namespace:string,id:string,type='access',hint?:string){const socket=io(`${url}/${namespace}`,{transports:['websocket'],autoConnect:false,reconnection:false,auth:{token:jwt.sign({sub:id,type,tokenVersion:1}),...(hint?{tenantId:hint}:{})}});sockets.push(socket);const outcome=new Promise<boolean>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('connection timeout')),2000);socket.once(namespace==='chat'?'connection-established':'connected',()=>{clearTimeout(timer);resolve(true);});socket.once('disconnect',()=>{clearTimeout(timer);resolve(false);});});socket.connect();return{socket,accepted:await outcome};}
 async function action(socket:Socket,event:string,data:unknown,successEvent?:string){return new Promise<{success?:boolean;error?:unknown}>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('action timeout')),2000);const done=(result:{success?:boolean;error?:unknown})=>{clearTimeout(timer);socket.off('exception',fail);socket.off('disconnect',disconnected);if(successEvent)socket.off(successEvent,success);resolve(result);};const fail=(error:unknown)=>done({error});const disconnected=()=>fail('disconnected');const success=()=>done({success:true});socket.once('exception',fail);socket.once('disconnect',disconnected);if(successEvent)socket.once(successEvent,success);socket.emit(event,data,done);});}
 it.each(['tickets','chat'])('%s rejects refresh tokens and mismatched tenant hints',async ns=>{expect((await connect(ns,'ua','refresh')).accepted).toBe(false);expect((await connect(ns,'ua','access','b')).accepted).toBe(false);});
 it('ticket room requires owner/staff within the verified tenant',async()=>{const a=await connect('tickets','ua');const other=await connect('tickets','ua2');expect((await action(a.socket,'subscribe:ticket','tb')).success).not.toBe(true);expect((await action(other.socket,'subscribe:ticket','ta')).success).not.toBe(true);expect((await action(a.socket,'subscribe:ticket','ta')).success).toBe(true);users.get('ua')!.tokenVersion=2;expect((await action(a.socket,'subscribe:ticket','ta')).success).not.toBe(true);});
 it('ticket notifications cannot leak across tenant rooms',async()=>{const a=await connect('tickets','ua');const b=await connect('tickets','ub');await action(a.socket,'subscribe:ticket','ta');await action(b.socket,'subscribe:ticket','tb');const received:unknown[]=[];b.socket.on('ticket:status_changed',p=>received.push(p));const delivered=new Promise(resolve=>a.socket.once('ticket:status_changed',resolve));await tickets.emitStatusChanged('ta','open','closed',[]);expect(await delivered).toMatchObject({ticketId:'ta'});expect(received).toEqual([]);});
 it('chat room checks every session action and derives ALS from identity',async()=>{const a=await connect('chat','ua');const other=await connect('chat','ua2');expect((await action(a.socket,'join-session',{sessionId:'tb'},'session-joined')).success).not.toBe(true);expect((await action(other.socket,'typing-start',{sessionId:'ta'})).success).not.toBe(true);expect((await action(a.socket,'join-session',{sessionId:'ta'},'session-joined')).success).toBe(true);expect(chat.getSessionUserCount('ta')).toBe(1);users.get('ua')!.tokenVersion=2;expect((await action(a.socket,'ping',{timestamp:'test'},'pong')).success).not.toBe(true);});
 it('chat broadcasts reach only the authorized session room',async()=>{const a=await connect('chat','ua');const b=await connect('chat','ub');await action(a.socket,'join-session',{sessionId:'ta'},'session-joined');await action(b.socket,'join-session',{sessionId:'tb'},'session-joined');const received:unknown[]=[];b.socket.on('user-connection-status',p=>received.push(p));const delivered=new Promise(resolve=>a.socket.once('user-connection-status',resolve));await chat.broadcastConnectionStatus('ta','ua','online');expect(await delivered).toMatchObject({sessionId:'ta'});expect(received).toEqual([]);});
 it.each(['tickets','chat'])('%s fences passive pushes after credential revocation',async ns=>{
  const {socket}=await connect(ns,'ua');
  if(ns==='chat')await action(socket,'join-session',{sessionId:'ta'},'session-joined');else await action(socket,'subscribe:ticket','ta');
  const received:unknown[]=[];socket.on(ns==='chat'?'message-received':'ticket:status_changed',value=>received.push(value));users.get('ua')!.tokenVersion=2;
  if(ns==='chat')await chat.broadcastAIResponse('ta',{content:'secret'});else await tickets.emitStatusChanged('ta','open','closed',[]);
  await new Promise(resolve=>setTimeout(resolve,30));expect(received).toEqual([]);
 });
 it.each(['tickets','chat'])('%s fences passive staff demotion from another owner room',async ns=>{
  users.get('ua2')!.roleNames=['admin'];const {socket}=await connect(ns,'ua2');
  if(ns==='chat')await action(socket,'join-support',{sessionId:'ta'});else await action(socket,'subscribe:ticket','ta');
  const received:unknown[]=[];socket.on(ns==='chat'?'message-received':'ticket:status_changed',value=>received.push(value));users.get('ua2')!.roleNames=['viewer'];
  if(ns==='chat')await chat.broadcastAIResponse('ta',{content:'secret'});else await tickets.emitStatusChanged('ta','open','closed',[]);
  await new Promise(resolve=>setTimeout(resolve,30));expect(received).toEqual([]);
 });

 it('preserves streamed event order through the recipient authorization queue',async()=>{
  const {socket}=await connect('chat','ua');await action(socket,'join-session',{sessionId:'ta'},'session-joined');
  const received:string[]=[];const completed=new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('stream timeout')),2000);socket.on('ai-response-chunk',(data:{chunk:string})=>{received.push(data.chunk);if(received.length===3){clearTimeout(timer);resolve();}});});
  await Promise.all(['first','second','third'].map(chunk=>chat.broadcastAIResponseChunk('ta',chunk)));await completed;expect(received).toEqual(['first','second','third']);
 });
 it('delivers internal notes only to current staff, never owner room or user room',async()=>{
  users.get('ua2')!.roleNames=['admin'];const owner=await connect('tickets','ua');const staff=await connect('tickets','ua2');
  await action(owner.socket,'subscribe:ticket','ta');await action(staff.socket,'subscribe:ticket','ta');
  const received:unknown[]=[];owner.socket.on('ticket:message',value=>received.push(value));
  const delivered=new Promise(resolve=>staff.socket.once('ticket:message',resolve));
  await tickets.emitNewMessage('ta',{id:'private',isInternal:true,content:'internal-secret'},['ua','ua2']);
  expect(await delivered).toMatchObject({message:{content:'internal-secret'}});await new Promise(resolve=>setTimeout(resolve,30));expect(received).toEqual([]);
  const publicDelivery=new Promise(resolve=>owner.socket.once('ticket:message',resolve));
  await tickets.emitNewMessage('ta',{id:'public',isInternal:false,content:'customer-visible'},[]);
  expect(await publicDelivery).toMatchObject({message:{content:'customer-visible'}});
 });

});
