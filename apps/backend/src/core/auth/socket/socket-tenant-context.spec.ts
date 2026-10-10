import { lastValueFrom, Observable } from 'rxjs';
import { SocketTenantInterceptor } from './socket-identity';
import { TenantService } from '../../tenant/tenant.service';
import { ExecutionContext } from '@nestjs/common';
jest.mock('../../../modules/users/users.service',()=>({UsersService:class{}}));
it('binds verified socket identity as authenticated ALS for asynchronous handler execution',async()=>{
 const tenants=new TenantService();const interceptor=new SocketTenantInterceptor(tenants);
 const context={switchToWs:()=>({getClient:()=>({data:{identity:{tenantId:'tenant-a',userId:'actor'}}})})} as unknown as ExecutionContext;
 const observed=await lastValueFrom(interceptor.intercept(context,{handle:()=>new Observable(subscriber=>{setTimeout(()=>{subscriber.next(tenants.getTenantContext());subscriber.complete();},0);})}));
 expect(observed).toEqual({tenantId:'tenant-a',source:'authenticated'});expect(tenants.getTenantContext()).toBeUndefined();
});
