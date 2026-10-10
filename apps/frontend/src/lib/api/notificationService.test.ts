import { httpClient } from './http-client';
import { notificationService } from './notificationService';
jest.mock('./http-client', () => ({ httpClient: {getWrapped:jest.fn(),postWrapped:jest.fn()} }));
describe('Recipient notification transport', () => {
 beforeEach(()=>jest.clearAllMocks());
 it('lists current authenticated recipient without accepting tenant or user overrides',async()=>{
  const records=[{id:'n1',message:'Ticket updated',isRead:false}];
  (httpClient.getWrapped as jest.Mock).mockResolvedValue(records);
  expect(await notificationService.list()).toEqual(records);
  expect(httpClient.getWrapped).toHaveBeenCalledWith('/notifications');
 });
 it('requests an explicit bounded page without identity parameters',async()=>{
  await notificationService.list({limit:50,offset:50});
  expect(httpClient.getWrapped).toHaveBeenCalledWith('/notifications',{params:{limit:50,offset:50}});
 });
 it('persists a single read and returns server state',async()=>{
  const record={id:'n1',isRead:true}; (httpClient.postWrapped as jest.Mock).mockResolvedValue(record);
  expect(await notificationService.markRead('n1')).toEqual(record);
  expect(httpClient.postWrapped).toHaveBeenCalledWith('/notifications/n1/read',{});
 });
 it('encodes notification ids as one path segment',async()=>{
  await notificationService.markRead('../foreign?tenant=x');
  expect(httpClient.postWrapped).toHaveBeenCalledWith('/notifications/..%2Fforeign%3Ftenant%3Dx/read',{});
 });
 it('marks only authenticated recipient records, without a supplied identity',async()=>{
  await notificationService.markAllRead();
  expect(httpClient.postWrapped).toHaveBeenCalledWith('/notifications/read-all',{});
 });
 it.each(['list','markRead','markAllRead'] as const)('propagates %s failure instead of showing fake success',async method=>{
  const error=new Error('Unavailable');
  (httpClient.getWrapped as jest.Mock).mockRejectedValue(error);
  (httpClient.postWrapped as jest.Mock).mockRejectedValue(error);
  await expect(notificationService[method]('n1')).rejects.toThrow('Unavailable');
 });
});
