import { NeuralGridService } from './neural-grid.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NeuralSignal } from '../interfaces/neural-signal.interface';
import * as transport from '../../../core/cortex/signed-request';

describe('neural memory forwarding', () => {
  afterEach(() => jest.restoreAllMocks());
  it.each(['outage', 'unacknowledged', 'invalid-time'])('does not break business event or claim durable forwarding on %s', async failure => {
    const service = new NeuralGridService({} as HttpService, {} as ConfigService);
    const post = jest.spyOn(transport, 'postToCortex');
    if (failure === 'outage') post.mockRejectedValue(new Error('offline'));
    else post.mockResolvedValue({ status: 'pending' });
    const signal = { tenantId: 'tenant-a', source: 'test', type: 'created', timestamp: failure === 'invalid-time' ? new Date('invalid') : new Date() } as NeuralSignal;
    await expect(service.handleNeuralSignal(signal)).resolves.toBeUndefined();
    if (failure === 'invalid-time') expect(post).not.toHaveBeenCalled();
    else expect(post).toHaveBeenCalledWith(expect.anything(), expect.anything(), '/signals/ingest', expect.objectContaining({ tenantId: 'tenant-a' }));
  });
});
