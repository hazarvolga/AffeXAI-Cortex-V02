import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AICategorizationController } from './ai-categorization.controller';
import { AICategorizationService } from '../services/ai-categorization.service';
import { Ticket } from '../entities/ticket.entity';
import { TicketCategory } from '../entities/ticket-category.entity';
import { TenantModule } from '../../../core/tenant/tenant.module';
import { UsersService } from '../../users/users.service';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor';
describe('categorization capability HTTP contract',()=>{
 let app:INestApplication,jwt:JwtService;
 const admin=randomUUID(),customer=randomUUID();
 const tickets={count:jest.fn().mockResolvedValue(0),findOne:jest.fn()};
 beforeAll(async()=>{
  const module=await Test.createTestingModule({imports:[TenantModule,JwtModule.register({secret:'local-ai-capability-fixture-only'})],controllers:[AICategorizationController],providers:[AICategorizationService,{provide:getRepositoryToken(Ticket),useValue:tickets},{provide:getRepositoryToken(TicketCategory),useValue:{}},{provide:UsersService,useValue:{findOne:async id=>({id,tenantId:'tenant-a',isActive:true,tokenVersion:1,roles:[],roleNames:[id===admin?'admin':'customer']})}}]}).compile();app=module.createNestApplication();app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));app.useGlobalInterceptors(new ResponseInterceptor());await app.init();jwt=module.get(JwtService);
 });
 afterAll(async()=>app.close());beforeEach(()=>jest.clearAllMocks());const token=id=>jwt.sign({sub:id,type:'access',tokenVersion:1});
 it('requires staff identity for statistics',async()=>{await request(app.getHttpServer()).get('/tickets/ai/stats').expect(401);await request(app.getHttpServer()).get('/tickets/ai/stats').auth(token(customer),{type:'bearer'}).expect(403);expect(tickets.count).not.toHaveBeenCalled();});
 it('returns measured counts and unknown modelmetrics explicitly',async()=>{const response=await request(app.getHttpServer()).get('/tickets/ai/stats').auth(token(admin),{type:'bearer'}).expect(200);expect(response.body.data).toMatchObject({source:'keyword_heuristic',trainingAvailable:false,totalTickets:0,categorizedTickets:0,accuracyRate:null,averageConfidence:null,totalPredictions:null,autoAssigned:null});expect(tickets.count).toHaveBeenCalledWith({where:{tenantId:'tenant-a'}});});
 it('training never acknowledges fake completion',async()=>{const response=await request(app.getHttpServer()).post('/tickets/ai/train').auth(token(admin),{type:'bearer'}).expect(503);expect(response.body.message).toContain('not implemented');expect(tickets.count).not.toHaveBeenCalled();});
 it('malformed ticket/category ids fail before repository queries',async()=>{await request(app.getHttpServer()).get('/tickets/ai/not-uuid/suggestions').auth(token(admin),{type:'bearer'}).expect(400);await request(app.getHttpServer()).post(`/tickets/ai/${randomUUID()}/validate`).auth(token(admin),{type:'bearer'}).send({predictedCategoryId:'bad',actualCategoryId:'bad'}).expect(400);expect(tickets.findOne).not.toHaveBeenCalled();});
});
