import { TicketsService } from './tickets.service';
describe('ticket AI analysis truthfulness',()=>{
 const completion=jest.fn(); const snapshot=jest.fn();
 const service=Object.assign(Object.create(TicketsService.prototype),{
 tenantService:{getTenantContext:()=>({tenantId:'tenant',source:'authenticated'}),getTenantId:()=> 'tenant'},
 logger:{log:jest.fn(),debug:jest.fn(),error:jest.fn(),warn:jest.fn()},
 settingsService:{getAiModuleConfiguration:snapshot},
 faqSearchService:{search:async()=>({results:[]})},aiService:{generateCompletion:completion},
 appLoggerService:{logError:async()=>{},logAiCall:async()=>{}},
 });
 beforeEach(()=>{jest.clearAllMocks();snapshot.mockResolvedValue({apiKey:'fixture-not-real',model:'gpt-4',provider:'openai',revision:1});});
 it('marks valid provider response available',async()=>{completion.mockResolvedValue({content:JSON.stringify({summary:'summary',priority:'high',suggestion:'suggestion'})});expect(await service.analyzeTicketWithAI('issue','category')).toMatchObject({analysisAvailable:true,priority:'high'});expect(completion).toHaveBeenCalledWith('fixture-not-real',expect.any(String),expect.objectContaining({provider:'openai',credentialContext:{tenantId:'tenant',module:'support',provider:'openai',revision:1}}));});
 it('marks missing configuration unavailable without calling provider',async()=>{snapshot.mockResolvedValue({apiKey:null,model:'gpt-4',provider:'openai',revision:1});expect(await service.analyzeTicketWithAI('issue','category')).toMatchObject({analysisAvailable:false});expect(completion).not.toHaveBeenCalled();});
 it.each(['not json',JSON.stringify({summary:{invalid:true},priority:'high',suggestion:'suggestion'}),JSON.stringify({summary:'summary',priority:'invented',suggestion:'suggestion'})])('rejects invalid provider content %s',async(content)=>{completion.mockResolvedValue({content});expect(await service.analyzeTicketWithAI('issue','category')).toMatchObject({analysisAvailable:false});});
 it('marks provider error unavailable',async()=>{completion.mockRejectedValue(new Error('offline'));expect(await service.analyzeTicketWithAI('issue','category')).toMatchObject({analysisAvailable:false});});
});
