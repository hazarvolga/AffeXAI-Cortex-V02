import {FaqLearningService} from './faq-learning.service';
import {FaqAiService} from './faq-ai.service';
import {TenantService} from '../../../core/tenant/tenant.service';
describe('FAQ ingestion cannot bypass human review',()=>{
 const tenants=new TenantService();const save=jest.fn();const emitSignal=jest.fn();const source={sourceId:'source',source:'ticket',question:'Question',answer:'Answer',context:'Context',metadata:{}};
 const service=Object.assign(Object.create(FaqLearningService.prototype),{tenantService:tenants,faqRepository:{save},patternRepository:{},strategyService:{emitSignal},logger:{warn:jest.fn(),log:jest.fn()},getPipelineConfig:async()=>({enableAutoPublishing:true}),confidenceCalculator:{calculateConfidence:async()=>({overallConfidence:99,recommendation:'auto_publish',factors:{}})},faqAiService:{generateFaqAnswer:jest.fn(async()=>({answer:'Generated answer',keywords:[],metadata:{}}))}});
 const run=callback=>tenants.runWithTenant({tenantId:'ta',source:'authenticated'},callback);
 beforeEach(()=>jest.clearAllMocks());
 it('confidence and auto-publish config cannot publish unreviewed generated answer',async()=>{const faqs=await run(()=>service.generateFaqs([source],[],'ta'));expect(faqs[0].status).toBe('pending_review');expect(faqs[0].reviewedBy).toBeUndefined();});
 it.each(['pending_review','rejected','published'])('ingestion persistence never emits unreviewed %s content to Cortex',async status=>{await run(()=>service.saveResults([{...source,tenantId:'ta',status}],[],'ta'));expect(emitSignal).not.toHaveBeenCalled();});
 it('rejects foreign scope before saving or provider work',async()=>{await expect(run(()=>service.generateFaqs([source],[],'tb'))).rejects.toThrow();await expect(run(()=>service.saveResults([{...source,tenantId:'tb'}],[],'ta'))).rejects.toThrow();expect(save).not.toHaveBeenCalled();expect(service.faqAiService.generateFaqAnswer).not.toHaveBeenCalled();});
 it('realtime extraction receives tenant and source ID before limiting',async()=>{const extract=jest.fn(async()=>[]);Object.assign(service,{getPipelineConfig:async()=>({enableRealTimeProcessing:true}),ticketExtractor:{extract},chatExtractor:{extract}});await run(()=>service.processRealTimeData('ticket','source','ta'));expect(extract).toHaveBeenCalledWith(expect.objectContaining({tenantId:'ta',sourceIds:['source'],maxResults:1}));});
});
describe('FAQ provider status does not spend credits on read',()=>{
 it('reports configured but unverified without testApiKey',async()=>{const probe=jest.fn(async()=>true);const service=Object.assign(Object.create(FaqAiService.prototype),{settingsService:{getAiModuleConfiguration:async()=>({apiKey:'fixture-key',model:'gpt-4',provider:'openai',revision:1})},aiService:{testApiKey:probe}});expect(await service.getProviderStatus('ta')).toMatchObject({configured:true,healthChecked:false,available:false});expect(probe).not.toHaveBeenCalled();});
});
