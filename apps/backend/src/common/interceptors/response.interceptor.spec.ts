import { StreamableFile } from '@nestjs/common';
import { Readable } from 'node:stream';
import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('Response envelope preserves binary delivery', () => {
  const interceptor = new ResponseInterceptor();
  it('passes streams through without nesting them in JSON', async () => {
    const file = new StreamableFile(Readable.from(Buffer.from('private fixture')));
    expect(await firstValueFrom(interceptor.intercept({} as any,{handle:()=>of(file)}))).toBe(file);
  });
  it('wraps ordinary data and preserves already-wrapped envelopes', async () => {
    expect(await firstValueFrom(interceptor.intercept({} as any,{handle:()=>of({id:'fixture'})}))).toEqual(expect.objectContaining({success:true,data:{id:'fixture'}}));
    const envelope={success:true,data:{id:'fixture'}};
    expect(await firstValueFrom(interceptor.intercept({} as any,{handle:()=>of(envelope)}))).toBe(envelope);
  });
});
