import { NextRequest } from 'next/server';
import { knowledgeAdminRequest } from './request';
export const GET=(request:NextRequest)=>knowledgeAdminRequest(request,'GET',`/knowledge-base/admin/all?${request.nextUrl.searchParams}`,true);
export const POST=(request:NextRequest)=>knowledgeAdminRequest(request,'POST','/knowledge-base/articles');
