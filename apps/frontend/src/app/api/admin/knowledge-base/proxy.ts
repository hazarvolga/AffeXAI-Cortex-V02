export function knowledgeBackendUrl(value = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9006'): string {
  const base=value.replace(/\/+$/,'');return base.endsWith('/api')?base:`${base}/api`;
}
export async function forwardKnowledgeAdmin(token:string,method:'GET'|'POST'|'PATCH'|'DELETE',path:string,body?:unknown,list=false):Promise<Response>{
 const headers={'Cache-Control':'private, no-store'};
 if(!token)return Response.json({message:'Oturum açmanız gerekiyor.'},{status:401,headers});
 let payload:Record<string,unknown>|undefined;
 if(body!==undefined){
  if(!body || typeof body!=='object' || Array.isArray(body) || Object.keys(body).some(key=>!['title','content','summary','categoryId','tags','isFeatured','isPublished','status'].includes(key)))return Response.json({message:'Geçersiz makale alanları.'},{status:400,headers});
  payload={...body};
  if('isPublished' in payload){if(typeof payload.isPublished!=='boolean')return Response.json({message:'Geçersiz yayın durumu.'},{status:400,headers});payload.status=payload.isPublished?'published':'draft';delete payload.isPublished;}
  if(payload.categoryId==='')delete payload.categoryId;
 }
 try{
  const result=await fetch(`${knowledgeBackendUrl()}${path}`,{method,cache:'no-store',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})});
  if(!result.ok)return Response.json({message:'Makale işlemi tamamlanamadı.'},{status:result.status,headers});
  const json=await result.json();const data=json?.success===true && Object.prototype.hasOwnProperty.call(json,'data')?json.data:json;
  return Response.json(list?data.articles:data,{status:result.status,headers});
 }catch{return Response.json({message:'Bilgi bankası hizmetine ulaşılamıyor.'},{status:503,headers});}
}
