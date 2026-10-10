import { NextRequest } from 'next/server';
import { forwardKnowledgeAdmin } from './proxy';
export async function knowledgeAdminRequest(request:NextRequest,method:'GET'|'POST'|'PATCH'|'DELETE',path:string,list=false):Promise<Response>{
 if(method!=='GET'){
  const origin=request.headers.get('origin');
  if((origin && origin!==request.nextUrl.origin) || request.headers.get('sec-fetch-site')==='cross-site')return Response.json({message:'Geçersiz istek kaynağı.'},{status:403});
 }
 const authorization=request.headers.get('authorization');
 const token=authorization?.startsWith('Bearer ')?authorization.slice(7):request.cookies.get('auth_token')?.value||'';
 let body:unknown;
 if(method==='POST'||method==='PATCH'){try{body=await request.json();}catch{return Response.json({message:'Geçersiz istek.'},{status:400});}}
 return forwardKnowledgeAdmin(token,method,path,body,list);
}
