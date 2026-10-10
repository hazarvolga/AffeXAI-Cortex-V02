import { NextRequest } from 'next/server';
import { knowledgeAdminRequest } from '../../request';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){return knowledgeAdminRequest(request,'PATCH',`/knowledge-base/articles/${encodeURIComponent((await params).id)}`);}
