import { randomUUID } from 'node:crypto';
import { AICategorizationService } from './ai-categorization.service';
describe('categorization truthful capability and tenant boundary',()=>{
 const id=randomUUID(),categoryId=randomUUID();
 const tickets={find:jest.fn().mockResolvedValue([]),count:jest.fn().mockResolvedValue(0),findOne:jest.fn(),save:jest.fn(),update:jest.fn().mockResolvedValue({affected:1})};
 const categories={find:jest.fn().mockResolvedValue([{id:categoryId,name:'Technical',tenantId:'tenant-a'}]),findOne:jest.fn().mockResolvedValue({id:categoryId,tenantId:'tenant-a'})};
 const service=new AICategorizationService(tickets as never,categories as never,{getTenantId:()=> 'tenant-a'} as never);
 beforeEach(()=>{jest.clearAllMocks();tickets.findOne.mockResolvedValue({id,tenantId:'tenant-a',subject:'Server error',description:'Technical error'});});
 it('training is explicit unsupported503 and never fake completion',async()=>{await expect(service.trainModel()).rejects.toMatchObject({status:503});});
 it('returns null unmeasured metrics and observed counts only',async()=>{tickets.count.mockResolvedValueOnce(8).mockResolvedValueOnce(3);expect(await service.getStatistics()).toEqual({source:'keyword_heuristic',trainingAvailable:false,totalTickets:8,categorizedTickets:3,totalPredictions:null,autoAssigned:null,averageConfidence:null,accuracyRate:null});});
 it('missing tenant fails before repository',async()=>{const missing=new AICategorizationService(tickets as never,categories as never,{getTenantId:()=>undefined} as never);await expect(missing.getStatistics()).rejects.toThrow();expect(tickets.find).not.toHaveBeenCalled();expect(tickets.count).not.toHaveBeenCalled();});
 it('autoassign never overwrites stale ticket state',async()=>{await service.autoCategorizе(id);expect(tickets.save).not.toHaveBeenCalled();expect(tickets.update).toHaveBeenCalledWith({id,tenantId:'tenant-a'},{categoryId});});
 it('prediction identifies relative keyword scoring',async()=>{const prediction=await service.predictCategory({id,tenantId:'tenant-a',subject:'Server error',description:'Technical error'} as never);expect(prediction[0]).toEqual(expect.objectContaining({source:'keyword_heuristic',scoreMeaning:'relative_keyword_match'}));});
 it('direct foreign ticket text is not processed under current tenant',async()=>{await expect(service.predictCategory({id,tenantId:'tenant-b',subject:'Server error',description:'Body'} as never)).rejects.toThrow();expect(categories.find).not.toHaveBeenCalled();});
 it('validation cannot claim comparison for nonexistent tenant ticket',async()=>{tickets.findOne.mockResolvedValueOnce(null);await expect(service.validatePrediction(id,categoryId,categoryId)).rejects.toThrow();});
});
