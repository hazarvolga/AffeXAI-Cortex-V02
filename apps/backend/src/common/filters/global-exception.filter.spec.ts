import type { ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  it('maps body-parser payload limit errors to a safe 413 response', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const request = { method: 'POST', url: '/api/public/forms/example/submit' };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ status, json }),
      }),
    } as unknown as ArgumentsHost;
    const exception = Object.assign(new Error('request entity too large'), {
      type: 'entity.too.large',
      status: 413,
      statusCode: 413,
      body: 'must not leak',
    });

    new GlobalExceptionFilter().catch(exception, host);

    expect(status).toHaveBeenCalledWith(413);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request body is too large',
          statusCode: 413,
        },
      }),
    );
    expect(JSON.stringify(json.mock.calls)).not.toContain('must not leak');
  });

  it.each([
    Object.assign(new Error('upstream rejected payload'), { status: 413 }),
    Object.assign(new Error('upstream rejected payload'), { statusCode: 413 }),
    { type: 'entity.too.large', status: 413 },
  ])('does not misclassify non-body-parser errors as request limit violations', (exception) => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', url: '/api/example' }),
        getResponse: () => ({ status, json }),
      }),
    } as unknown as ArgumentsHost;

    new GlobalExceptionFilter().catch(exception, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500,
        }),
      }),
    );
  });
});
