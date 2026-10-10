import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { mountPublicFormBodyParsers } from './body-parser-policy';

describe('public form body parser policy', () => {
  const createApp = () => {
    const app = express();
    mountPublicFormBodyParsers(app);
    app.use(express.json({ limit: '10mb' }));
    app.post('/api/forms/public/:tenantId/:formId/submissions', (req, res) => {
      res.status(201).json(req.body);
    });
    app.post('/api/other', (req, res) => res.status(201).json({ received: Boolean(req.body) }));
    app.use((error: { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
      res.sendStatus(error.status ?? 500);
    });
    return app;
  };

  it('parses a bounded public form payload', async () => {
    await request(createApp())
      .post('/api/forms/public/acme/form-1/submissions')
      .send({ data: { message: 'hello' } })
      .expect(201, { data: { message: 'hello' } });
  });

  it('rejects more than 64KB before the route handler receives a parsed body', async () => {
    await request(createApp())
      .post('/api/forms/public/acme/form-1/submissions')
      .send({ data: { message: 'x'.repeat(64 * 1024) } })
      .expect(413);
  });

  it('keeps the larger application parser available outside public forms', async () => {
    await request(createApp())
      .post('/api/other')
      .send({ data: { message: 'x'.repeat(65 * 1024) } })
      .expect(201, { received: true });
  });
});
