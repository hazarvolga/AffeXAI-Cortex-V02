import { ChatAiController } from './chat-ai.controller';
import { ChatAiService } from '../services/chat-ai.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { DocumentUploadController } from './document-upload.controller';
import { DocumentProcessorService } from '../services/document-processor.service';
import { ChatSessionService } from '../services/chat-session.service';
import { ChatMessageService } from '../services/chat-message.service';
import { ChatGateway } from '../gateways/chat.gateway';
import { UsersService } from '../../users/users.service';
import { TenantModule } from '../../../core/tenant/tenant.module';

const sessionId = '00000000-0000-4000-8000-000000000001';
const documentId = '00000000-0000-4000-8000-000000000002';
const messageId = '00000000-0000-4000-8000-000000000003';
describe('chat document ownership over HTTP', () => {
  let app: INestApplication; let jwt: JwtService;
  const ai = { generateChatResponse: jest.fn().mockResolvedValue({ content: 'Answer' }), generateStreamingChatResponse: jest.fn(async function* () { yield { content: 'Answer', isComplete: true }; }) };
  const documents = { processDocument: jest.fn(), getProcessingStatus: jest.fn(), getSessionDocuments: jest.fn() };
  const sessions = { getSession: jest.fn() }; const messages = { getMessage: jest.fn() };
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [TenantModule, JwtModule.register({ secret: 'local-document-ownership-test-only' })], controllers: [DocumentUploadController, ChatAiController], providers: [
      { provide: ChatAiService, useValue: ai }, { provide: DocumentProcessorService, useValue: documents }, { provide: ChatSessionService, useValue: sessions }, { provide: ChatMessageService, useValue: messages },
      { provide: ChatGateway, useValue: { emitFileProcessingStatus: jest.fn() } },
      { provide: UsersService, useValue: { findOne: async (id: string) => ({ id, tenantId: 'tenant-a', isActive: true, tokenVersion: 1, roleNames: id === 'staff' ? ['support', 'support_agent'] : ['customer', 'user'], roles: [] }) } },
    ] }).compile();
    app = mod.createNestApplication(); app.setGlobalPrefix('api'); app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })); await app.init(); jwt = mod.get(JwtService);
  });
  afterAll(async () => app.close());
  beforeEach(() => { jest.clearAllMocks(); sessions.getSession.mockResolvedValue({ id: sessionId, tenantId: 'tenant-a', userId: 'owner' }); documents.getProcessingStatus.mockResolvedValue({ id: documentId, sessionId, extractedContent: 'Private document' }); documents.getSessionDocuments.mockResolvedValue([]); documents.processDocument.mockResolvedValue({ id: documentId }); messages.getMessage.mockResolvedValue({ id: messageId, tenantId: 'tenant-a', sessionId: 'another-session' }); });
  const token = (sub: string) => jwt.sign({ sub, tokenVersion: 1, type: 'access' });
  const status = (sub: string) => request(app.getHttpServer()).get(`/api/chat/documents/${documentId}/status`).auth(token(sub), { type: 'bearer' });
  it('requires authentication', async () => { await request(app.getHttpServer()).get(`/api/chat/documents/${documentId}/status`).expect(401); });
  it('allows the session owner to read extracted content', async () => { const response = await status('owner').expect(200); expect(response.body.extractedContent).toBe('Private document'); });
  it('denies another user of the same tenant', async () => { await status('other').expect(403); });
  it('denies a foreign tenant session even to support staff', async () => { sessions.getSession.mockResolvedValue({ tenantId: 'tenant-b', userId: 'owner' }); await status('staff').expect(403); });
  it('allows same-tenant support staff', async () => { await status('staff').expect(200); });
  it('denies another users document listing', async () => { await request(app.getHttpServer()).get(`/api/chat/documents/session/${sessionId}`).auth(token('other'), { type: 'bearer' }).expect(403); expect(documents.getSessionDocuments).not.toHaveBeenCalled(); });
  it('denies upload into another users session before file persistence', async () => { await request(app.getHttpServer()).post('/api/chat/documents/upload').auth(token('other'), { type: 'bearer' }).field('sessionId', sessionId).attach('file', Buffer.from('Private'), 'document.txt').expect(403); expect(documents.processDocument).not.toHaveBeenCalled(); });
  it('denies attaching a document to a different session message', async () => { await request(app.getHttpServer()).post('/api/chat/documents/upload').auth(token('owner'), { type: 'bearer' }).field('sessionId', sessionId).field('messageId', messageId).attach('file', Buffer.from('Private'), 'document.txt').expect(403); expect(documents.processDocument).not.toHaveBeenCalled(); });
  it('denies another users AI context before generation', async () => {
    await request(app.getHttpServer()).post('/api/chat/ai/generate').auth(token('other'), { type: 'bearer' }).send({ prompt: 'Summarize documents', sessionId }).expect(403);
    expect(ai.generateChatResponse).not.toHaveBeenCalled();
  });
  it('allows AI generation for the session owner', async () => {
    await request(app.getHttpServer()).post('/api/chat/ai/generate').auth(token('owner'), { type: 'bearer' }).send({ prompt: 'Summarize documents', sessionId }).expect(201);
    expect(ai.generateChatResponse).toHaveBeenCalled();
  });
  it('rejects a message from a different session before AI context generation', async () => {
    await request(app.getHttpServer()).post('/api/chat/ai/generate').auth(token('owner'), { type: 'bearer' }).send({ prompt: 'Summarize', sessionId, messageId }).expect(403);
    expect(ai.generateChatResponse).not.toHaveBeenCalled();
  });
  it('rejects unauthorized SSE before creating the provider stream', async () => {
    await request(app.getHttpServer()).get('/api/chat/ai/stream').query({ prompt: 'Summarize', sessionId }).auth(token('other'), { type: 'bearer' }).expect(403);
    expect(ai.generateStreamingChatResponse).not.toHaveBeenCalled();
  });
  it('allows the authorized SSE stream to complete', async () => {
    const response = await request(app.getHttpServer()).get('/api/chat/ai/stream').query({ prompt: 'Summarize', sessionId }).auth(token('owner'), { type: 'bearer' }).expect(200);
    expect(response.text).toContain('Answer');
  });

});
