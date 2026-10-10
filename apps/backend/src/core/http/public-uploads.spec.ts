import express from 'express';
import request from 'supertest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mountPublicUploads } from './public-uploads';

describe('explicit public upload storage boundary', () => {
  let root: string;
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'cortex-upload-test-'));
    await mkdir(join(root, 'public')); await mkdir(join(root, 'chat-documents'));
    await writeFile(join(root, 'public', 'logo.txt'), 'Public logo');
    await writeFile(join(root, 'chat-documents', 'private.txt'), 'Private chat');
    await writeFile(join(root, 'certificate.pdf'), 'Private certificate');
  });
  afterAll(async () => rm(root, { recursive: true, force: true }));
  const app = () => { const server = express(); mountPublicUploads(server, root); return server; };
  it('serves only the explicitly published directory', async () => {
    await request(app()).get('/uploads/public/logo.txt').expect(200, 'Public logo');
  });
  it.each(['/uploads/chat-documents/private.txt', '/uploads/certificate.pdf', '/uploads/public/%2e%2e/chat-documents/private.txt'])('does not expose private file %s', async path => {
    await request(app()).get(path).expect(404);
  });
});
