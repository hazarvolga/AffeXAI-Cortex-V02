import { unwrapResponse } from './response-utils';
describe('API business result preservation',()=>{
 it.each([
  {success:true,message:'Reviewed',faq:{id:'faq',status:'approved'}},
  {success:true,message:'Processed',results:{successful:['a'],failed:[{faqId:'b',error:'Denied'}]}},
  {success:true,message:'Saved'},
 ])('preserves unwrapped business result %#',result=>expect(unwrapResponse(result)).toEqual(result));
 it('unwraps exactly one envelope',()=>{
  const result={success:true,message:'Reviewed',faq:{id:'faq'}};
  expect(unwrapResponse({success:true,data:result,meta:{timestamp:'now'}})).toEqual(result);
 });
 it.each([null,undefined,'',{success:true},{success:true,data:undefined},{success:true,meta:{timestamp:'now'}}])('preserves void handling %#',result=>expect(unwrapResponse(result)).toBeUndefined());
 it('still throws structured API errors',()=>expect(()=>unwrapResponse({success:false,error:{code:'DENIED',message:'Forbidden'}})).toThrow('Forbidden'));
});
