import { SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor, socketRoom, socketStaff } from '../../../core/auth/socket/socket-identity';
import { createWebSocketOriginValidator } from '../../../core/http/websocket-cors-policy';
import { ChatSessionGuard, ChatSessionRooms } from './chat-session.guard';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Namespace, Socket } from 'socket.io';
import { TenantService } from '../../../core/tenant/tenant.service';
import { ChatSessionService } from '../services/chat-session.service';
import { ChatMessageService } from '../services/chat-message.service';
import { GeneralCommunicationAiService } from '../services/general-communication-ai.service';
import { UsersService } from '../../users/users.service';
import { ChatMessageSenderType, ChatMessageType } from '../entities/chat-message.entity';
import { ChatSessionType } from '../entities/chat-session.entity';
import { GeneralCommunicationOptions } from '../services/general-communication-ai.service';

// Interface definitions for WebSocket data types
interface SendMessageData {
  sessionId: string;
  content: string;
  messageType?: ChatMessageType;
  metadata?: any;
}

interface FileUploadData {
  sessionId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  fileData: string;
}

interface UrlProcessData {
  sessionId: string;
  url: string;
}

interface FileProcessingStatus {
  sessionId: string;
  documentId: string;
  filename: string;
  status: string;
  fileSize: number;
  progress?: number;
  error?: string;
}

interface UrlProcessingStatus {
  sessionId: string;
  url: string;
  status: string;
  error?: string;
}

interface SupportJoinedData {
  sessionId: string;
  supportUserId: string;
  supportUserName: string;
}

interface SupportLeftData {
  sessionId: string;
  supportUserId: string;
  supportUserName: string;
}

interface SupportAssignmentData {
  sessionId: string;
  supportUserId: string;
  supportUserName: string;
}

interface SupportTransferData {
  sessionId: string;
  fromUserId: string;
  toUserId: string;
  reason?: string;
}

interface SupportEscalationData {
  sessionId: string;
  userId: string;
  reason: string;
  priority: string;
}

@Injectable()
@UseGuards(SocketAuthGuard, ChatSessionGuard)
@UseInterceptors(SocketTenantInterceptor)
@WebSocketGateway({
  cors: {
    origin: createWebSocketOriginValidator(),
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Namespace;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, { socket: Socket; userId: string; tenantId: string; sessionId?: string; lastHeartbeat?: Date }>();
  private typingUsers = new Map<string, Set<string>>(); // sessionId -> Set of userIds
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>(); // socketId -> interval

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatSessionService: ChatSessionService,
    private readonly chatMessageService: ChatMessageService,
    private readonly generalCommunicationAiService: GeneralCommunicationAiService,
    private readonly usersService: UsersService,
    private readonly tenantService: TenantService,
    private readonly identities: SocketIdentityService,
    private readonly sessionAccess: ChatSessionRooms,
  ) { }

  private emitRoom(room: string, event: string, payload: unknown, excludedId?: string) {
    return this.identities.emitRoom(this.server, room, event, payload, async (identity, id, kind) => {
      if (kind !== 'chat') return true;
      return this.tenantService.runWithTenant({ tenantId: identity.tenantId }, async () => {
        const session = await this.chatSessionService.getSession(id);
        return !!session && session.tenantId === identity.tenantId && (session.userId === identity.userId || socketStaff(identity));
      });
    }, excludedId);
  }

  private emitRoomExcept(client: Socket, room: string, event: string, payload: unknown) {
    return this.emitRoom(room, event, payload, client.id);
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  // ... (existing helper methods)

  async handleConnection(client: Socket) {
    try {
      const identity = await this.identities.verify(client);
      const { userId, tenantId } = identity;
      const role = socketStaff(identity) ? 'support' : 'user';
      if (socketStaff(identity)) await client.join(socketRoom(tenantId, 'staff'));

      // Check for existing connections from the same user
      const existingConnection = Array.from(this.connectedUsers.values())
        .find(conn => conn.userId === userId);

      if (existingConnection) {
        this.logger.log(`User ${userId} reconnecting, closing previous connection`);
        existingConnection.socket.disconnect();
        this.connectedUsers.delete(existingConnection.socket.id);
      }

      this.connectedUsers.set(client.id, { socket: client, userId, tenantId: String(tenantId) });
      client.data.userId = userId;
      client.data.role = role;
      client.data.tenantId = String(tenantId);

      this.logger.log(`User ${userId} connected to tenant ${tenantId} with socket ${client.id}`);

      // Emit connection success with user info
      await client.join(socketRoom(client.data.tenantId, 'user', client.data.userId));
      await client.join(socketRoom(client.data.tenantId, 'tenant'));
      client.emit('connection-established', {
        userId,
        socketId: client.id,
        timestamp: new Date(),
        serverTime: new Date().toISOString()
      });

      // Set up heartbeat for connection monitoring
      this.setupHeartbeat(client);

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.emit('error', {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
        retryable: false,
        timestamp: new Date()
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const connection = this.connectedUsers.get(client.id);
    if (connection) {
      const { userId, sessionId } = connection;

      // Remove from typing indicators
      if (sessionId) {
        this.removeFromTyping(sessionId, userId);

        // Notify session participants about user leaving
        void this.emitRoomExcept(client, this.sessionAccess.room(sessionId), 'user-left', {
          userId,
          sessionId,
          timestamp: new Date()
        });
      }

      // Clear heartbeat interval
      const heartbeatInterval = this.heartbeatIntervals.get(client.id);
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        this.heartbeatIntervals.delete(client.id);
      }

      this.connectedUsers.delete(client.id);
      this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
    }
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    const tenantId = client.data.tenantId;

    // Wrap execution in tenant context
    await this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        const userId = client.data.userId;
        const { sessionId } = data;

        // Validate session access
        const hasAccess = await this.chatSessionService.validateSessionAccess(sessionId, userId);
        if (!hasAccess) {
          client.emit('error', { message: 'Access denied to session' });
          return;
        }

        // Join the session room
        await client.join(this.sessionAccess.room(sessionId));

        // Update connection info
        const connection = this.connectedUsers.get(client.id);
        if (connection) {
          connection.sessionId = sessionId;
        }

        // Notify others in the session
        void this.emitRoomExcept(client, this.sessionAccess.room(sessionId), 'user-joined', { userId, sessionId });

        // Confirm join to the user
        client.emit('session-joined', { sessionId });

        this.logger.log(`User ${userId} joined session ${sessionId}`);

      } catch (error) {
        this.logger.error('Error joining session:', error);
        client.emit('error', { message: 'Failed to join session' });
      }
    });
  }

  @SubscribeMessage('leave-session')
  async handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      const userId = client.data.userId;
      const { sessionId } = data;

      // Leave the session room
      await client.leave(this.sessionAccess.room(sessionId));

      // Remove from typing indicators
      this.removeFromTyping(sessionId, userId);

      // Update connection info
      const connection = this.connectedUsers.get(client.id);
      if (connection) {
        connection.sessionId = undefined;
      }

      // Notify others in the session
      void this.emitRoomExcept(client, this.sessionAccess.room(sessionId), 'user-left', { userId, sessionId });

      this.logger.log(`User ${userId} left session ${sessionId}`);

    } catch (error) {
      this.logger.error('Error leaving session:', error);
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageData
  ) {
    const tenantId = client.data.tenantId;

    await this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        const userId = client.data.userId;
        const { sessionId, content, messageType, metadata } = data;

        // Get session to determine type
        const session = await this.chatSessionService.getSession(sessionId);
        if (!session) {
          client.emit('error', { message: 'Session not found' });
          return;
        }

        // Send the message - ensure service call scope is correct
        const message = await this.chatMessageService.sendMessage({
          sessionId,
          senderType: ChatMessageSenderType.USER,
          senderId: userId,
          content,
          messageType: messageType || ChatMessageType.TEXT,
          metadata
        }, userId);

        // Broadcast to all users in the session
        void this.emitRoom(this.sessionAccess.room(sessionId), 'message-received', message);

        // Handle AI response based on session type
        if (session.sessionType === ChatSessionType.GENERAL) {
          // Use general communication AI service
          // Pass tenantId explicitly if service doesn't pick it up or rely on ALS context
          this.handleGeneralCommunicationResponse(sessionId, content, userId, tenantId);
        }
        // Support sessions are handled by existing support AI service

        this.logger.log(`Message sent in session ${sessionId} by user ${userId}`);

      } catch (error) {
        this.logger.error('Error sending message:', error);
        client.emit('error', { message: 'Failed to send message' });
      }
    });
  }

  @SubscribeMessage('typing-start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    const tenantId = client.data.tenantId;
    await this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        const userId = client.data.userId;
        const { sessionId } = data;

        this.addToTyping(sessionId, userId);

        // Broadcast typing indicator to others in the session
        void this.emitRoomExcept(client, this.sessionAccess.room(sessionId), 'typing-indicator', {
          sessionId,
          userId,
          isTyping: true
        });

      } catch (error) {
        this.logger.error('Error handling typing start:', error);
      }
    });
  }

  @SubscribeMessage('typing-stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    const tenantId = client.data.tenantId;
    await this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        const userId = client.data.userId;
        const { sessionId } = data;

        this.removeFromTyping(sessionId, userId);

        // Broadcast typing stop to others in the session
        void this.emitRoomExcept(client, this.sessionAccess.room(sessionId), 'typing-indicator', {
          sessionId,
          userId,
          isTyping: false
        });

      } catch (error) {
        this.logger.error('Error handling typing stop:', error);
      }
    });
  }

  @SubscribeMessage('upload-file')
  async handleFileUpload(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: FileUploadData
  ) {
    const tenantId = client.data.tenantId;
    await this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        const userId = client.data.userId;
        const { sessionId, filename, fileType, fileSize, fileData } = data;

        // Validate session access
        const hasAccess = await this.chatSessionService.validateSessionAccess(sessionId, userId);
        if (!hasAccess) {
          client.emit('error', {
            code: 'ACCESS_DENIED',
            message: 'Access denied to session',
            retryable: false,
            timestamp: new Date()
          });
          return;
        }

        // Validate file size (10MB limit)
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (fileSize > maxFileSize) {
          client.emit('error', {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`,
            retryable: false,
            timestamp: new Date()
          });
          return;
        }

        // Validate file type
        const allowedTypes = ['pdf', 'docx', 'xlsx', 'txt', 'md'];
        const fileExtension = filename.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedTypes.includes(fileExtension)) {
          client.emit('error', {
            code: 'INVALID_FILE_FORMAT',
            message: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`,
            retryable: false,
            timestamp: new Date()
          });
          return;
        }

        // Generate temporary document ID
        const tempDocumentId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Emit processing status to all session participants
        void this.emitRoom(this.sessionAccess.room(sessionId), 'file-processing-status', {
          sessionId,
          documentId: tempDocumentId,
          status: 'pending',
          filename,
          fileSize,
          progress: 0
        });

        // Acknowledge the upload to sender
        client.emit('file-upload-acknowledged', {
          sessionId,
          documentId: tempDocumentId,
          filename,
          status: 'received'
        });

        this.logger.log(`File upload initiated in session ${sessionId}: ${filename} (${fileSize} bytes)`);

      } catch (error) {
        this.logger.error('Error handling file upload:', error);
        client.emit('error', {
          code: 'FILE_PROCESSING_FAILED',
          message: 'Failed to process file upload',
          retryable: true,
          timestamp: new Date()
        });
      }
    });
  }

  @SubscribeMessage('process-url')
  async handleUrlProcess(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UrlProcessData
  ) {
    const tenantId = client.data.tenantId;
    await this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        const userId = client.data.userId;
        const { sessionId, url } = data;

        // Validate session access
        const hasAccess = await this.chatSessionService.validateSessionAccess(sessionId, userId);
        if (!hasAccess) {
          client.emit('error', {
            code: 'ACCESS_DENIED',
            message: 'Access denied to session',
            retryable: false,
            timestamp: new Date()
          });
          return;
        }

        // Basic URL validation
        try {
          new URL(url);
        } catch (urlError) {
          client.emit('error', {
            code: 'INVALID_URL',
            message: 'Invalid URL format',
            retryable: false,
            timestamp: new Date()
          });
          return;
        }

        // Check for supported protocols
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          client.emit('error', {
            code: 'INVALID_URL',
            message: 'Only HTTP and HTTPS URLs are supported',
            retryable: false,
            timestamp: new Date()
          });
          return;
        }

        // Emit processing status to all session participants
        void this.emitRoom(this.sessionAccess.room(sessionId), 'url-processing-status', {
          sessionId,
          url,
          status: 'pending'
        });

        // Acknowledge the request to sender
        client.emit('url-process-acknowledged', {
          sessionId,
          url,
          status: 'received'
        });

        this.logger.log(`URL processing initiated in session ${sessionId}: ${url}`);

      } catch (error) {
        this.logger.error('Error handling URL processing:', error);
        client.emit('error', {
          code: 'URL_PROCESSING_FAILED',
          message: 'Failed to process URL',
          retryable: true,
          timestamp: new Date()
        });
      }
    });
  }

  @SubscribeMessage('request-support')
  async handleRequestSupport(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; notes?: string }
  ) {
    const tenantId = client.data.tenantId;
    await this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        const userId = client.data.userId;
        const { sessionId, notes } = data;

        // Validate session access
        const hasAccess = await this.chatSessionService.validateSessionAccess(sessionId, userId);
        if (!hasAccess) {
          client.emit('error', { message: 'Access denied to session' });
          return;
        }

        // Emit support request to managers/admins
        void this.emitRoom(this.sessionAccess.staffRoom(sessionId), 'support-requested', {
          sessionId,
          userId,
          notes,
          timestamp: new Date(),
        });

        // Acknowledge the request
        client.emit('support-request-acknowledged', { sessionId });

        this.logger.log(`Support requested for session ${sessionId} by user ${userId}`);

      } catch (error) {
        this.logger.error('Error handling support request:', error);
        client.emit('error', { message: 'Failed to request support' });
      }
    });
  }

  @SubscribeMessage('join-support')
  async handleJoinSupport(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    const tenantId = client.data.tenantId;
    return this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        const userId = client.data.userId;
        const { sessionId } = data;

        // Validate support role
        const userRole = client.data.role;
        if (userRole !== 'admin' && userRole !== 'support') {
          this.logger.warn(`Unauthorized support join attempt by user ${userId} (role: ${userRole})`);
          client.emit('error', {
            code: 'FORBIDDEN',
            message: 'Only support agents can join support channel'
          });
          return;
        }


        // Join the session as support
        await client.join(this.sessionAccess.room(sessionId));

        // Get actual user name from database
        const supportUserName = await this.getUserDisplayName(userId);

        // Notify session participants
        void this.emitRoomExcept(client, this.sessionAccess.room(sessionId), 'support-joined', {
          sessionId,
          supportUserId: userId,
          supportUserName,
        });

        this.logger.log(`Support user ${userId} joined session ${sessionId}`);
        return { success: true };

      } catch (error) {
        this.logger.error('Error handling support join:', error);
        client.emit('error', { message: 'Failed to join as support' });
      }
    });
  }

  @SubscribeMessage('leave-support')
  async handleLeaveSupport(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    const tenantId = client.data.tenantId;
    await this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        const userId = client.data.userId;
        const { sessionId } = data;

        // Leave the session
        await client.leave(this.sessionAccess.room(sessionId));

        // Get actual user name from database
        const supportUserName = await this.getUserDisplayName(userId);

        // Notify session participants
        void this.emitRoomExcept(client, this.sessionAccess.room(sessionId), 'support-left', {
          sessionId,
          supportUserId: userId,
          supportUserName,
        });

        this.logger.log(`Support user ${userId} left session ${sessionId}`);

      } catch (error) {
        this.logger.error('Error handling support leave:', error);
      }
    });
  }

  // Public methods for other services to emit events

  /**
   * Broadcast AI response to session
   */
  async broadcastAIResponse(sessionId: string, message: any) {
    void this.emitRoom(this.sessionAccess.room(sessionId), 'message-received', message);
  }

  /**
   * Broadcast AI response start
   */
  async broadcastAIResponseStart(sessionId: string) {
    void this.emitRoom(this.sessionAccess.room(sessionId), 'ai-response-start', { sessionId });
  }

  /**
   * Broadcast AI response chunk (for streaming)
   */
  async broadcastAIResponseChunk(sessionId: string, chunk: string) {
    void this.emitRoom(this.sessionAccess.room(sessionId), 'ai-response-chunk', { sessionId, chunk });
  }

  /**
   * Broadcast AI response complete
   */
  async broadcastAIResponseComplete(sessionId: string, message: any) {
    void this.emitRoom(this.sessionAccess.room(sessionId), 'ai-response-complete', message);
  }

  /**
   * Broadcast file processing status
   */
  async broadcastFileProcessingStatus(status: FileProcessingStatus) {
    void this.emitRoom(this.sessionAccess.room(status.sessionId), 'file-processing-status', status);
  }

  /**
   * Emit file processing status for a specific session
   */
  async emitFileProcessingStatus(sessionId: string, data: {
    documentId: string;
    filename: string;
    status: string;
    fileSize: number;
    progress?: number;
    error?: string;
  }) {
    void this.emitRoom(this.sessionAccess.room(sessionId), 'file-processing-status', {
      sessionId,
      ...data
    });
  }

  /**
   * Broadcast URL processing status
   */
  async broadcastUrlProcessingStatus(status: UrlProcessingStatus) {
    void this.emitRoom(this.sessionAccess.room(status.sessionId), 'url-processing-status', status);
  }

  /**
   * Broadcast support team joined
   */
  async broadcastSupportJoined(data: SupportJoinedData) {
    void this.emitRoom(this.sessionAccess.room(data.sessionId), 'support-joined', data);
  }

  /**
   * Broadcast support team left
   */
  async broadcastSupportLeft(data: SupportLeftData) {
    void this.emitRoom(this.sessionAccess.room(data.sessionId), 'support-left', data);
  }

  /**
   * Broadcast session update
   */
  async broadcastSessionUpdate(sessionId: string, session: any) {
    void this.emitRoom(this.sessionAccess.room(sessionId), 'session-updated', session);
  }

  /**
   * Broadcast support assignment notification
   */
  async broadcastSupportAssignment(data: SupportAssignmentData) {
    void this.emitRoom(this.sessionAccess.room(data.sessionId), 'support-assigned', data);
  }

  /**
   * Broadcast support transfer notification
   */
  async broadcastSupportTransfer(data: SupportTransferData) {
    void this.emitRoom(this.sessionAccess.room(data.sessionId), 'support-transferred', data);
  }

  /**
   * Broadcast support escalation notification
   */
  async broadcastSupportEscalation(data: SupportEscalationData) {
    void this.emitRoom(this.sessionAccess.room(data.sessionId), 'support-escalated', data);

    // Also notify managers/admins
    void this.emitRoom(this.sessionAccess.staffRoom(data.sessionId), 'escalation-alert', data);
  }

  /**
   * Send notification to specific user
   */
  async sendUserNotification(userId: string, notification: any) {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) return;
    await this.identities.emitRoom(this.server, socketRoom(tenantId, 'user', userId), 'notification', notification);
  }

  async sendRoleNotification(roles: string[], notification: any) {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) return;
    await this.identities.emitRoom(this.server, socketRoom(tenantId, 'tenant'), 'role-notification', notification,
      async identity => identity.roleNames.some(role => roles.includes(role)));
  }

  // Private helper methods

  private addToTyping(sessionId: string, userId: string) {
    if (!this.typingUsers.has(sessionId)) {
      this.typingUsers.set(sessionId, new Set());
    }
    this.typingUsers.get(sessionId)!.add(userId);
  }

  private removeFromTyping(sessionId: string, userId: string) {
    const typingInSession = this.typingUsers.get(sessionId);
    if (typingInSession) {
      typingInSession.delete(userId);
      if (typingInSession.size === 0) {
        this.typingUsers.delete(sessionId);
      }
    }
  }

  /**
   * Get user display name for notifications
   */
  private async getUserDisplayName(userId: string): Promise<string> {
    try {
      const user = await this.usersService.findOne(userId);
      return user?.fullName || user?.email || 'Support User';
    } catch (error) {
      this.logger.warn(`Failed to get user display name for ${userId}: ${error.message}`);
      return 'Support User';
    }
  }

  /**
   * Get connected users count for a session
   */
  getSessionUserCount(sessionId: string): number {
    return this.server.adapter.rooms.get(this.sessionAccess.room(sessionId))?.size || 0;
  }

  /**
   * Get all connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Additional event handlers for enhanced functionality

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { timestamp: string }
  ) {
    const connection = this.connectedUsers.get(client.id);
    if (connection) {
      connection.lastHeartbeat = new Date();
      client.emit('heartbeat-ack', {
        timestamp: new Date().toISOString(),
        clientTimestamp: data.timestamp
      });
    }
  }

  @SubscribeMessage('get-session-info')
  async handleGetSessionInfo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      const userId = client.data.userId;
      const { sessionId } = data;

      // Validate session access
      const hasAccess = await this.chatSessionService.validateSessionAccess(sessionId, userId);
      if (!hasAccess) {
        client.emit('error', {
          code: 'ACCESS_DENIED',
          message: 'Access denied to session',
          retryable: false,
          timestamp: new Date()
        });
        return;
      }

      // Get session info
      const session = await this.chatSessionService.getSession(sessionId);
      const participantCount = this.getSessionUserCount(sessionId);
      const typingUsers = this.typingUsers.get(sessionId) || new Set();

      client.emit('session-info', {
        session,
        participantCount,
        typingUserCount: typingUsers.size,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error('Error getting session info:', error);
      client.emit('error', {
        code: 'SESSION_INFO_FAILED',
        message: 'Failed to get session information',
        retryable: true,
        timestamp: new Date()
      });
    }
  }

  @SubscribeMessage('ping')
  async handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { timestamp: string }
  ) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      clientTimestamp: data.timestamp
    });
  }

  // Private helper methods

  /**
   * Set up heartbeat monitoring for a client
   */
  private setupHeartbeat(client: Socket) {
    const heartbeatInterval = setInterval(() => {
      const connection = this.connectedUsers.get(client.id);
      if (!connection) {
        clearInterval(heartbeatInterval);
        return;
      }

      const now = new Date();
      const lastHeartbeat = connection.lastHeartbeat || now;
      const timeSinceLastHeartbeat = now.getTime() - lastHeartbeat.getTime();

      // If no heartbeat for 60 seconds, disconnect
      if (timeSinceLastHeartbeat > 60000) {
        this.logger.warn(`Client ${client.id} heartbeat timeout, disconnecting`);
        client.disconnect();
        clearInterval(heartbeatInterval);
        return;
      }

      // Send heartbeat request
      client.emit('heartbeat-request', { timestamp: now.toISOString() });
    }, 30000); // Check every 30 seconds

    this.heartbeatIntervals.set(client.id, heartbeatInterval);
  }

  /**
   * Broadcast connection status to session participants
   */
  async broadcastConnectionStatus(sessionId: string, userId: string, status: 'online' | 'offline') {
    void this.emitRoom(this.sessionAccess.room(sessionId), 'user-connection-status', {
      sessionId,
      userId,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string) {
    const participantCount = this.getSessionUserCount(sessionId);
    const typingUsers = this.typingUsers.get(sessionId) || new Set();

    return {
      participantCount,
      typingUserCount: typingUsers.size,
      typingUsers: Array.from(typingUsers)
    };
  }

  /**
   * Cleanup stale connections
   */
  private cleanupStaleConnections() {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [socketId, connection] of this.connectedUsers.entries()) {
      const lastHeartbeat = connection.lastHeartbeat || now;
      const timeSinceLastHeartbeat = now.getTime() - lastHeartbeat.getTime();

      if (timeSinceLastHeartbeat > staleThreshold) {
        this.logger.warn(`Cleaning up stale connection for user ${connection.userId}`);
        connection.socket.disconnect();
        this.connectedUsers.delete(socketId);

        const heartbeatInterval = this.heartbeatIntervals.get(socketId);
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          this.heartbeatIntervals.delete(socketId);
        }
      }
    }
  }

  /**
   * Initialize cleanup interval
   */
  private initializeCleanup() {
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  // General Communication Methods

  /**
   * Handle general communication AI response
   */
  private async handleGeneralCommunicationResponse(sessionId: string, query: string, userId: string, tenantId: string) {
    try {
      this.logger.log(`Generating general communication response for session ${sessionId}`);

      // Emit AI response start
      void this.emitRoom(this.sessionAccess.room(sessionId), 'ai-response-start', { sessionId });

      // Generate AI response
      const aiResponse = await this.generalCommunicationAiService.generateGeneralResponse(
        query,
        sessionId,
        {
          includeContextSources: true,
          tone: 'friendly',
          language: 'tr'
        } as GeneralCommunicationOptions
      );

      // Create AI message
      const aiMessage = await this.chatMessageService.sendMessage({
        sessionId,
        senderType: ChatMessageSenderType.AI,
        content: aiResponse.content,
        messageType: ChatMessageType.TEXT,
        metadata: {
          aiModel: 'general-communication',
          confidence: aiResponse.confidence,
          responseType: aiResponse.responseType,
          contextSources: aiResponse.contextSources,
          suggestedActions: aiResponse.suggestedActions,
          escalationReason: aiResponse.escalationReason
        }
      });

      // Broadcast AI response
      void this.emitRoom(this.sessionAccess.room(sessionId), 'ai-response-complete', aiMessage);

      // If escalation is suggested, emit escalation event
      if (aiResponse.responseType === 'escalation-suggested') {
        void this.emitRoom(this.sessionAccess.room(sessionId), 'escalation-suggested', {
          sessionId,
          reason: aiResponse.escalationReason,
          message: 'AI suggests escalating to support team'
        });
      }

      this.logger.log(`General communication response generated for session ${sessionId} with confidence: ${aiResponse.confidence}`);

    } catch (error) {
      this.logger.error(`Error generating general communication response: ${error.message}`, error.stack);

      // Send error message to session
      const errorMessage = await this.chatMessageService.sendMessage({
        sessionId,
        senderType: ChatMessageSenderType.AI,
        content: 'Üzgünüm, şu anda sorununuza uygun bir yanıt oluşturamıyorum. Lütfen sorunuzu daha detaylı açıklayın veya destek ekibimizle iletişime geçin.',
        messageType: ChatMessageType.TEXT,
        metadata: {
          aiModel: 'general-communication',
          confidence: 0.3,
          responseType: 'error',
          error: true
        }
      });

      void this.emitRoom(this.sessionAccess.room(sessionId), 'ai-response-complete', errorMessage);
    }
  }

  @SubscribeMessage('get-conversation-starters')
  async handleGetConversationStarters(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { language?: string }
  ) {
    try {
      const { language = 'tr' } = data;

      const starters = await this.generalCommunicationAiService.getConversationStarters(language);

      client.emit('conversation-starters', {
        starters,
        language,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error('Error getting conversation starters:', error);
      client.emit('error', {
        code: 'CONVERSATION_STARTERS_FAILED',
        message: 'Failed to get conversation starters',
        retryable: true,
        timestamp: new Date()
      });
    }
  }

  @SubscribeMessage('escalate-to-support')
  async handleEscalateToSupport(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; reason?: string; notes?: string }
  ) {
    try {
      const userId = client.data.userId;
      const { sessionId, reason, notes } = data;

      // Validate session access
      const hasAccess = await this.chatSessionService.validateSessionAccess(sessionId, userId);
      if (!hasAccess) {
        client.emit('error', {
          code: 'ACCESS_DENIED',
          message: 'Access denied to session',
          retryable: false,
          timestamp: new Date()
        });
        return;
      }

      // Get current session
      const session = await this.chatSessionService.getSession(sessionId);
      if (!session) {
        client.emit('error', { message: 'Session not found' });
        return;
      }

      // Update session type to support if it's currently general
      if (session.sessionType === ChatSessionType.GENERAL) {
        await this.chatSessionService.updateSession(sessionId, {
          sessionType: ChatSessionType.SUPPORT,
          metadata: {
            ...session.metadata,
            escalatedFrom: 'general',
            escalationReason: reason,
            escalationNotes: notes,
            escalatedAt: new Date(),
            escalatedBy: userId
          }
        });

        // Create system message about escalation
        const escalationMessage = await this.chatMessageService.sendMessage({
          sessionId,
          senderType: ChatMessageSenderType.AI,
          content: 'Sohbet destek ekibine yönlendirildi. Bir destek temsilcisi kısa süre içinde size yardımcı olacak.',
          messageType: ChatMessageType.SYSTEM,
          metadata: {
            escalation: true,
            reason,
            notes
          }
        });

        // Broadcast escalation to session
        void this.emitRoom(this.sessionAccess.room(sessionId), 'session-escalated', {
          sessionId,
          reason,
          notes,
          escalatedBy: userId,
          timestamp: new Date()
        });

        // Broadcast system message
        void this.emitRoom(this.sessionAccess.room(sessionId), 'message-received', escalationMessage);

        // Notify support team
        void this.emitRoom(this.sessionAccess.staffRoom(sessionId), 'support-escalation-alert', {
          sessionId,
          userId,
          reason,
          notes,
          timestamp: new Date()
        });
      }

      client.emit('escalation-acknowledged', { sessionId });

      this.logger.log(`Session ${sessionId} escalated to support by user ${userId}`);

    } catch (error) {
      this.logger.error('Error handling escalation to support:', error);
      client.emit('error', {
        code: 'ESCALATION_FAILED',
        message: 'Failed to escalate to support',
        retryable: true,
        timestamp: new Date()
      });
    }
  }

  @SubscribeMessage('get-suggested-topics')
  async handleGetSuggestedTopics(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { limit?: number }
  ) {
    try {
      const { limit = 6 } = data;

      const topics = await this.generalCommunicationAiService['generalContextService'].getSuggestedTopics(limit);

      client.emit('suggested-topics', {
        topics,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error('Error getting suggested topics:', error);
      client.emit('error', {
        code: 'SUGGESTED_TOPICS_FAILED',
        message: 'Failed to get suggested topics',
        retryable: true,
        timestamp: new Date()
      });
    }
  }
}
