import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { DNSVerificationService } from './dns-verification.service';
import { UsersService } from '../users/users.service';
import { TenantModule } from '../../core/tenant/tenant.module';
jest.mock('./settings.service',()=>({SettingsService:class {}}));
jest.mock('./dns-verification.service',()=>({DNSVerificationService:class {}}));
jest.mock('../users/users.service',()=>({UsersService:class {}}));
jest.mock('@nestjs/mapped-types',()=>({PartialType:require('@nestjs/swagger').PartialType}));

describe('Settings authorization and secret disclosure HTTP boundary',()=>{
 let app:INestApplication;let jwt:JwtService;
 const stored={id:'setting',category:'email',key:'smtp.password',value:'credential-test-secret',isEncrypted:true,encryptedDek:'wrapped-key-test'};
 const raw={smtp:{password:'credential-test-secret'}};const masked={smtp:{password:'***'}};
 const service={getAiModuleConfiguration:jest.fn(async()=>({apiKey:'configured-test-key',model:'test-model',provider:'openai',revision:1})),getStorageSettings:jest.fn(async()=>({awsS3:{accessKeyId:'stored-access-id',secretAccessKey:'stored-secret'}})),updateStorageSettings:jest.fn(async(dto)=>dto),findAll:jest.fn(async()=>[stored]),findOne:jest.fn(async()=>stored),create:jest.fn(async()=>stored),update:jest.fn(async()=>stored),remove:jest.fn(),getEmailSettings:jest.fn(async()=>raw),getEmailSettingsMasked:jest.fn(async()=>masked),updateEmailSettings:jest.fn(async()=>raw),getSiteSettings:jest.fn(async()=>({companyName:'Public name',strategicRadar:{competitors:{urls:['private-research']}}})),updateSiteSettings:jest.fn(async(dto)=>dto)};
 beforeAll(async()=>{const mod=await Test.createTestingModule({imports:[TenantModule,JwtModule.register({secret:'isolated-settings-http-secret'})],controllers:[SettingsController],providers:[{provide:SettingsService,useValue:service},{provide:DNSVerificationService,useValue:{}},{provide:UsersService,useValue:{findOne:async(id:string)=>({id,tenantId:'ta',organizationId:'org-ta',organization:{id:'org-ta',slug:'ta',isActive:true},isActive:true,tokenVersion:1,roles:[{name:'member',permissions:id==='manager'?['settings.manage']:[]}],roleNames:['member']})}}]}).compile();app=mod.createNestApplication();await app.init();jwt=mod.get(JwtService);});
 afterAll(async()=>app.close());beforeEach(()=>jest.clearAllMocks());
 const auth=(id='manager')=>`Bearer ${jwt.sign({sub:id,type:'access',tokenVersion:1})}`;
 it.each(['/settings','/settings/individual/setting','/settings/email','/settings/email/masked','/settings/storage','/settings/ai'])('denies ordinary users reading %s',async path=>{await request(app.getHttpServer()).get(path).set('Authorization',auth('viewer')).expect(403);});
 it.each([['post','/settings'],['put','/settings/individual/setting'],['delete','/settings/individual/setting'],['put','/settings/site'],['put','/settings/email'],['put','/settings/storage'],['patch','/settings/ai']] as const)('denies ordinary user %s %s',async(method,path)=>{await request(app.getHttpServer())[method](path).set('Authorization',auth('viewer')).send({}).expect(403);});
 it('never exposes plaintext or encrypted key material from generic reads',async()=>{for(const path of ['/settings','/settings/individual/setting']){const response=await request(app.getHttpServer()).get(path).set('Authorization',auth()).expect(200);expect(JSON.stringify(response.body)).not.toContain(stored.value);expect(JSON.stringify(response.body)).not.toContain(stored.encryptedDek);}expect(service.findAll).toHaveBeenCalledWith('ta');expect(stored.value).toBe('credential-test-secret');});
 it('closes generic create and update endpoints',async()=>{for(const [method,path] of [['post','/settings'],['put','/settings/individual/setting']] as const){await request(app.getHttpServer())[method](path).set('Authorization',auth()).send({category:'email',key:'smtp.password',value:'replacement'}).expect(400);}expect(service.create).not.toHaveBeenCalled();expect(service.update).not.toHaveBeenCalled();});
 it('uses masked email responses for read and update',async()=>{const read=await request(app.getHttpServer()).get('/settings/email').set('Authorization',auth()).expect(200);expect(read.body).toEqual(masked);const write=await request(app.getHttpServer()).put('/settings/email').set('Authorization',auth()).send({}).expect(200);expect(write.body).toEqual(masked);});
 it('keeps public site projection available for an explicit tenant',async()=>{const response=await request(app.getHttpServer()).get('/settings/site').set('x-tenant-id','ta').expect(200);expect(response.body.strategicRadar).toBeUndefined();expect(service.getSiteSettings).toHaveBeenCalledWith('ta');});
 it('rejects public site requests with missing tenant instead of selecting a default',async()=>{await request(app.getHttpServer()).get('/settings/site').expect(400);expect(service.getSiteSettings).not.toHaveBeenCalled();});
 it('keeps private site fields editable only through the authorized endpoint',async()=>{await request(app.getHttpServer()).get('/settings/site/admin').set('Authorization',auth('viewer')).expect(403);const response=await request(app.getHttpServer()).get('/settings/site/admin').set('Authorization',auth()).expect(200);expect(response.body.strategicRadar.competitors.urls).toEqual(['private-research']);});
 it('passes the authenticated actor into audited site updates',async()=>{const body={companyName:'XYZ',domain:'xyz.example',contact:{address:'',phone:'',email:'test@example.com'},socialMedia:{},seo:{defaultTitle:'XYZ',defaultDescription:'XYZ'}};await request(app.getHttpServer()).put('/settings/site').set('Authorization',auth()).send(body).expect(200);expect(service.updateSiteSettings).toHaveBeenCalledWith(body,'ta','manager');});

 it('passes masked preserve markers without decrypting stored credentials in the controller',async()=>{await request(app.getHttpServer()).put('/settings/email').set('Authorization',auth()).send({smtp:{password:'***',host:'mail.example.test'}}).expect(200);expect(service.updateEmailSettings).toHaveBeenCalledWith({smtp:{password:'***',host:'mail.example.test'}},'ta','manager');expect(service.getEmailSettings).not.toHaveBeenCalled();});
 it('rejects masked writes through the generic endpoint',async()=>{await request(app.getHttpServer()).put('/settings/individual/setting').set('Authorization',auth()).send({value:'***'}).expect(400);expect(service.update).not.toHaveBeenCalled();});

 it('does not claim live AI connectivity from a stored credential',async()=>{const response=await request(app.getHttpServer()).post('/settings/ai/test/support').set('Authorization',auth()).expect(201);expect(response.body.success).toBe(false);expect(JSON.stringify(response.body)).not.toContain('configured-test-key');});
 it('passes storage preserve markers without loading plaintext credentials',async()=>{await request(app.getHttpServer()).put('/settings/storage').set('Authorization',auth()).send({awsS3:{accessKeyId:'***s-id',secretAccessKey:'***',bucket:'new-bucket'}}).expect(200);expect(service.updateStorageSettings).toHaveBeenCalledWith({awsS3:{accessKeyId:'***s-id',secretAccessKey:'***',bucket:'new-bucket'}},'ta','manager');expect(service.getStorageSettings).not.toHaveBeenCalled();});

});
