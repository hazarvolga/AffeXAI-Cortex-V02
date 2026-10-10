import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { io, Socket } from 'socket.io-client';
import { ChatGateway } from '../src/modules/chat/gateways/chat.gateway';
import { ChatSessionService } from '../src/modules/chat/services/chat-session.service';
import { ChatMessageService } from '../src/modules/chat/services/chat-message.service';
import { ChatSession } from '../src/modules/chat/entities/chat-session.entity';
import { ChatMessage } from '../src/modules/chat/entities/chat-message.entity';
import { User } from '../src/modules/users/entities/user.entity';

describe('Chat WebSocket Integration', () => {
  let app: INestApplication;
  let gateway: ChatGateway;
  let chatSessionService: ChatSessionService;
  let chatMessageService: ChatMessageService;
  let jwtService: JwtService;
  let clientSocket: Socket;
  let serverSocket: Socket;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  };

  const mockSession = {
    id: 'test-session-id',
    userId: mockUser.id,
    sessionType: 'support',
    status: 'active',
    title: 'Test Session',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockResolvedValue({ sub: mockUser.id, userId: mockUser.id })
          }
        },
        {
          provide: ChatSessionService,
          useValue: {
            validateSessionAccess: jest.fn().mockResolvedValue(true),
            getSession: jest.fn().mockResolvedValue(mockSession)
          }
        },
        {
          provide: ChatMessageService,
          useValue: {
            sendMessage: jest.fn().mockResolvedValue({
              id: 'test-message-id',
              sessionId: mockSession.id,
              senderType: 'user',
              senderId: mockUser.id,
              content: 'Test message',
              messageType: 'text',
              createdAt: new Date()
            })
          }
        }
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    gateway = moduleFixture.get<ChatGateway>(ChatGateway);
    chatSessionService = moduleFixture.get<ChatSessionService>(ChatSessionService);
    chatMessageService = moduleFixture.get<ChatMessageService>(ChatMessageService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.listen(3001);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach((done) => {
    // Create client socket connection
    clientSocket = io('http://localhost:3001/chat', {
      auth: {
        token: 'valid-jwt-token'
      },
      transports: ['websocket']
    });

    clientSocket.on('connect', () => {
      done();
    });
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Connection Management', () => {
    it('should establish connection with valid token', (done) => {
      clientSocket.on('connection-established', (data) => {
        expect(data.userId).toBe(mockUser.id);
        expect(data.socketId).toBeDefined();
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    it('should handle heartbeat requests', (done) => {
      clientSocket.on('heartbeat-request', (data) => {
        expect(data.timestamp).toBeDefined();
        
        // Respond to heartbeat
        clientSocket.emit('heartbeat', { timestamp: new Date().toISOString() });
        
        clientSocket.on('heartbeat-ack', (ackData) => {
          expect(ackData.timestamp).toBeDefined();
          expect(ackData.clientTimestamp).toBeDefined();
          done();
        });
      });

      // Trigger heartbeat by waiting
      setTimeout(() => {
        // Heartbeat should be triggered automatically
      }, 100);
    });

    it('should respond to ping requests', (done) => {
      const timestamp = Date.now().toString();
      
      clientSocket.emit('ping', { timestamp });
      
      clientSocket.on('pong', (data) => {
        expect(data.timestamp).toBeDefined();
        expect(data.clientTimestamp).toBe(timestamp);
        done();
      });
    });

    it('should handle connection errors gracefully', (done) => {
      // Create socket with invalid token
      const invalidSocket = io('http://localhost:3001/chat', {
        auth: {
          token: 'invalid-token'
        },
        transports: ['websocket']
      });

      invalidSocket.on('error', (error) => {
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
        expect(error.retryable).toBeDefined();
        expect(error.timestamp).toBeDefined();
        invalidSocket.disconnect();
        done();
      });
    });
  });

  describe('Session Management', () => {
    it('should join session successfully', (done) => {
      clientSocket.emit('join-session', { sessionId: mockSession.id });
      
      clientSocket.on('session-joined', (data) => {
        expect(data.sessionId).toBe(mockSession.id);
        done();
      });
    });

    it('should handle session access validation', (done) => {
      // Mock access denied
      jest.spyOn(chatSessionService, 'validateSessionAccess').mockResolvedValueOnce(false);
      
      clientSocket.emit('join-session', { sessionId: 'unauthorized-session' });
      
      clientSocket.on('error', (error) => {
        expect(error.code).toBe('ACCESS_DENIED');
        expect(error.message).toBe('Access denied to session');
        done();
      });
    });

    it('should get session information', (done) => {
      clientSocket.emit('get-session-info', { sessionId: mockSession.id });
      
      clientSocket.on('session-info', (data) => {
        expect(data.session).toBeDefined();
        expect(data.participantCount).toBeDefined();
        expect(data.typingUserCount).toBeDefined();
        expect(data.timestamp).toBeDefined();
        done();
      });
    });
  });

  describe('Message Handling', () => {
    beforeEach((done) => {
      // Join session first
      clientSocket.emit('join-session', { sessionId: mockSession.id });
      clientSocket.on('session-joined', () => done());
    });

    it('should send and receive messages', (done) => {
      const messageData = {
        sessionId: mockSession.id,
        content: 'Test message',
        messageType: 'text'
      };

      clientSocket.emit('send-message', messageData);
      
      clientSocket.on('message-received', (message) => {
        expect(message.sessionId).toBe(mockSession.id);
        expect(message.content).toBe('Test message');
        expect(message.senderType).toBe('user');
        done();
      });
    });

    it('should handle typing indicators', (done) => {
      let typingStartReceived = false;
      
      clientSocket.on('typing-indicator', (data) => {
        if (data.isTyping && !typingStartReceived) {
          expect(data.sessionId).toBe(mockSession.id);
          expect(data.userId).toBe(mockUser.id);
          expect(data.isTyping).toBe(true);
          typingStartReceived = true;
          
          // Send typing stop
          clientSocket.emit('typing-stop', { sessionId: mockSession.id });
        } else if (!data.isTyping && typingStartReceived) {
          expect(data.isTyping).toBe(false);
          done();
        }
      });

      // Start typing
      clientSocket.emit('typing-start', { sessionId: mockSession.id });
    });
  });

  describe('File Upload Handling', () => {
    beforeEach((done) => {
      clientSocket.emit('join-session', { sessionId: mockSession.id });
      clientSocket.on('session-joined', () => done());
    });

    it('should handle file upload requests', (done) => {
      const fileData = {
        sessionId: mockSession.id,
        filename: 'test.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        fileData: 'base64-encoded-data'
      };

      clientSocket.emit('upload-file', fileData);
      
      clientSocket.on('file-upload-acknowledged', (response) => {
        expect(response.sessionId).toBe(mockSession.id);
        expect(response.filename).toBe('test.pdf');
        expect(response.status).toBe('received');
        done();
      });
    });

    it('should validate file size limits', (done) => {
      const largeFileData = {
        sessionId: mockSession.id,
        filename: 'large-file.pdf',
        fileType: 'pdf',
        fileSize: 15 * 1024 * 1024, // 15MB - exceeds 10MB limit
        fileData: 'base64-encoded-data'
      };

      clientSocket.emit('upload-file', largeFileData);
      
      clientSocket.on('error', (error) => {
        expect(error.code).toBe('FILE_TOO_LARGE');
        expect(error.message).toContain('File size exceeds');
        done();
      });
    });

    it('should validate file types', (done) => {
      const invalidFileData = {
        sessionId: mockSession.id,
        filename: 'test.exe',
        fileType: 'exe',
        fileSize: 1024,
        fileData: 'base64-encoded-data'
      };

      clientSocket.emit('upload-file', invalidFileData);
      
      clientSocket.on('error', (error) => {
        expect(error.code).toBe('INVALID_FILE_FORMAT');
        expect(error.message).toContain('File type not supported');
        done();
      });
    });
  });

  describe('URL Processing', () => {
    beforeEach((done) => {
      clientSocket.emit('join-session', { sessionId: mockSession.id });
      clientSocket.on('session-joined', () => done());
    });

    it('should handle URL processing requests', (done) => {
      const urlData = {
        sessionId: mockSession.id,
        url: 'https://example.com'
      };

      clientSocket.emit('process-url', urlData);
      
      clientSocket.on('url-process-acknowledged', (response) => {
        expect(response.sessionId).toBe(mockSession.id);
        expect(response.url).toBe('https://example.com');
        expect(response.status).toBe('received');
        done();
      });
    });

    it('should validate URL format', (done) => {
      const invalidUrlData = {
        sessionId: mockSession.id,
        url: 'not-a-valid-url'
      };

      clientSocket.emit('process-url', invalidUrlData);
      
      clientSocket.on('error', (error) => {
        expect(error.code).toBe('INVALID_URL');
        expect(error.message).toBe('Invalid URL format');
        done();
      });
    });

    it('should validate URL protocol', (done) => {
      const ftpUrlData = {
        sessionId: mockSession.id,
        url: 'ftp://example.com/file.txt'
      };

      clientSocket.emit('process-url', ftpUrlData);
      
      clientSocket.on('error', (error) => {
        expect(error.code).toBe('INVALID_URL');
        expect(error.message).toBe('Only HTTP and HTTPS URLs are supported');
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should provide structured error responses', (done) => {
      // Try to join session without being connected
      const disconnectedSocket = io('http://localhost:3001/chat', {
        auth: { token: 'valid-jwt-token' },
        autoConnect: false
      });

      disconnectedSocket.connect();
      
      disconnectedSocket.on('connect', () => {
        disconnectedSocket.emit('join-session', { sessionId: 'non-existent-session' });
      });

      disconnectedSocket.on('error', (error) => {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('retryable');
        expect(error).toHaveProperty('timestamp');
        disconnectedSocket.disconnect();
        done();
      });
    });
  });

  describe('Support Team Integration', () => {
    beforeEach((done) => {
      clientSocket.emit('join-session', { sessionId: mockSession.id });
      clientSocket.on('session-joined', () => done());
    });

    it('should handle support join requests', (done) => {
      clientSocket.emit('join-support', { sessionId: mockSession.id });
      
      clientSocket.on('support-joined', (data) => {
        expect(data.sessionId).toBe(mockSession.id);
        expect(data.supportUserId).toBe(mockUser.id);
        expect(data.supportUserName).toBeDefined();
        done();
      });
    });

    it('should handle support leave requests', (done) => {
      // First join as support
      clientSocket.emit('join-support', { sessionId: mockSession.id });
      
      clientSocket.on('support-joined', () => {
        // Then leave
        clientSocket.emit('leave-support', { sessionId: mockSession.id });
      });
      
      clientSocket.on('support-left', (data) => {
        expect(data.sessionId).toBe(mockSession.id);
        expect(data.supportUserId).toBe(mockUser.id);
        done();
      });
    });

    it('should handle support requests', (done) => {
      const requestData = {
        sessionId: mockSession.id,
        notes: 'Need help with technical issue'
      };

      clientSocket.emit('request-support', requestData);
      
      clientSocket.on('support-request-acknowledged', (response) => {
        expect(response.sessionId).toBe(mockSession.id);
        done();
      });
    });
  });
});