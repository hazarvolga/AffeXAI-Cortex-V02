import { NextRequest } from 'next/server';
import { knowledgeAdminRequest } from '../request';
type Context={params:Promise<{id:string}>};
export async function GET(request:NextRequest,{params}:Context){return knowledgeAdminRequest(request,'GET',`/knowledge-base/admin/articles/${encodeURIComponent((await params).id)}`);}
export async function DELETE(request:NextRequest,{params}:Context){return knowledgeAdminRequest(request,'DELETE',`/knowledge-base/articles/${encodeURIComponent((await params).id)}`);}
export async function PUT(request:NextRequest,{params}:Context){return knowledgeAdminRequest(request,'PATCH',`/knowledge-base/articles/${encodeURIComponent((await params).id)}`);}
