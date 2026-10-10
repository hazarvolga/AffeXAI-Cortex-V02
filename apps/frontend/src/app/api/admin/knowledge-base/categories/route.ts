import { NextRequest } from 'next/server';
import { knowledgeAdminRequest } from '../request';
export const GET=(request:NextRequest)=>knowledgeAdminRequest(request,'GET','/tickets/categories/list');
