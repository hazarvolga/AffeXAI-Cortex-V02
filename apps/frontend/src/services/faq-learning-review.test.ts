import { FaqLearningService } from './faq-learning.service';
import { httpClient } from '@/lib/api/http-client';
jest.mock('@/lib/api/http-client',()=>({httpClient:{getWrapped:jest.fn(),postWrapped:jest.fn(),get:jest.fn(),post:jest.fn()}}));
describe('FAQ review transport',()=>{
 beforeEach(()=>jest.clearAllMocks());
 it('passes search and pagination and converts dates without mutating server records',async()=>{
  const row={id:'faq',createdAt:'2026-10-07T12:00:00.000Z'};const response={items:[row],total:1,page:2,totalPages:2};
  (httpClient.getWrapped as jest.Mock).mockResolvedValue(response);
  const result=await FaqLearningService.getReviewQueue({search:'XYZ & Company',page:2,limit:10,status:['approved']});
  expect(httpClient.getWrapped).toHaveBeenCalledWith('/review/queue?status=approved&search=XYZ+%26+Company&page=2&limit=10');
  expect(result.items[0].createdAt).toEqual(new Date(row.createdAt));expect(row.createdAt).toBe('2026-10-07T12:00:00.000Z');
 });
 it('uses unwrapped review result with only approved payload fields',async()=>{
  (httpClient.postWrapped as jest.Mock).mockResolvedValue({success:true,message:'saved'});
  expect(await FaqLearningService.reviewFaq('faq/id','publish',{reason:'reviewed',reviewerId:'forged',action:'reject'} as any)).toEqual({success:true,message:'saved'});
  expect(httpClient.postWrapped).toHaveBeenCalledWith('/review/faq%2Fid/review',{action:'publish',reason:'reviewed',editedAnswer:undefined,editedCategory:undefined,editedKeywords:undefined});
 });
 it('preserves partial bulk failures so UI cannot claim all succeeded',async()=>{
  const result={success:true,results:{successful:['a'],failed:[{faqId:'b',error:'rejected'}]}};
  (httpClient.postWrapped as jest.Mock).mockResolvedValue(result);
  expect(await FaqLearningService.bulkReview(['a','b'],'approve')).toEqual(result);
 });
 it('reads actual unwrapped stats',async()=>{
  const result={total:5,published:2};(httpClient.getWrapped as jest.Mock).mockResolvedValue(result);
  expect(await FaqLearningService.getReviewStats()).toEqual(result);
 });
 it('propagates denied review instead of returning success',async()=>{
  (httpClient.postWrapped as jest.Mock).mockRejectedValue(new Error('Forbidden'));
  await expect(FaqLearningService.reviewFaq('id','approve',{})).rejects.toThrow('Forbidden');
 });
});
