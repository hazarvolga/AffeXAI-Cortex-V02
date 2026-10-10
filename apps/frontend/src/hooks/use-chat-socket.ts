'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { socketTransport } from '@/lib/auth/socket-transport';
import { API_CONFIG } from '@/config/api.config';

interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'user' | 'ai' | 'support';
  senderId?: string;
  content: string;
  messageType: 'text' | 'file' | 'url' | 'system';
  metadata?: any;
  createdAt: Date;
}

interface ChatSession {
  id: string;
  userId: string;
  sessionType: 'support' | 'general';
  status: 'active' | 'closed' | 'transferred';
  title?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

interface SendMessageData {
  sessionId: string;
  content: string;
  messageType: 'text' | 'file' | 'url' | 'system';
}

interface FileUploadData {
  sessionId: string;
  file: File;
  messageId: string;
}

interface UrlProcessData {
  sessionId: string;
  url: string;
  messageId: string;
}

interface FileProcessingStatus {
  sessionId: string;
  messageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

interface UrlProcessingStatus {
  sessionId: string;
  messageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  preview?: {
    title?: string;
    description?: string;
    image?: string;
  };
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

interface TypingIndicatorData {
  sessionId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface UseChatSocketOptions {
  onMessageReceived?: (message: ChatMessage) => void;
  onAiResponseStart?: (sessionId: string) => void;
  onAiResponseChunk?: (data: { sessionId: string; chunk: string }) => void;
  onAiResponseComplete?: (message: ChatMessage) => void;
  onFileProcessingStatus?: (status: FileProcessingStatus) => void;
  onUrlProcessingStatus?: (status: UrlProcessingStatus) => void;
  onSupportJoined?: (data: SupportJoinedData) => void;
  onSupportLeft?: (data: SupportLeftData) => void;
  onTypingIndicator?: (data: TypingIndicatorData) => void;
  onSessionUpdated?: (session: ChatSession) => void;
  onConnectionStatusChange?: (isConnected: boolean) => void;
  onEscalationSuggested?: (data: { sessionId: string; reason: string; message: string }) => void;
}

export function useChatSocket(options: UseChatSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('offline');
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const messageQueue = useRef<any[]>([]);

  const {
    onMessageReceived,
    onAiResponseStart,
    onAiResponseChunk,
    onAiResponseComplete,
    onFileProcessingStatus,
    onUrlProcessingStatus,
    onSupportJoined,
    onSupportLeft,
    onTypingIndicator,
    onSessionUpdated,
    onConnectionStatusChange,
    onEscalationSuggested
  } = options;

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      // Create socket connection
      const transport = socketTransport('chat', API_CONFIG.SOCKET_URL, () => tokenStorage.getAccessToken());
      const socket = io(transport.url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: transport.auth
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Chat socket connected');
        setIsConnected(true);
        setConnectionError(null);
        setConnectionQuality('good');
        reconnectAttempts.current = 0;
        onConnectionStatusChange?.(true);
        
        // Process queued messages
        processMessageQueue();
        
        // Start heartbeat monitoring
        startHeartbeat();
        
        // Start ping monitoring for connection quality
        startPingMonitoring();
      });

      socket.on('disconnect', (reason) => {
        console.log('Chat socket disconnected:', reason);
        setIsConnected(false);
        setConnectionQuality('offline');
        onConnectionStatusChange?.(false);
        
        // Clear monitoring intervals
        clearHeartbeat();
        clearPingMonitoring();
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          attemptReconnect();
        } else if (reason === 'transport close' || reason === 'transport error') {
          // Network issues, attempt reconnect
          attemptReconnect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Chat socket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
        setConnectionQuality('offline');
        onConnectionStatusChange?.(false);
        attemptReconnect();
      });

      // Enhanced connection monitoring
      socket.on('connection-established', (data) => {
        console.log('Connection established:', data);
        setConnectionQuality('good');
      });

      socket.on('heartbeat-request', (data) => {
        socket.emit('heartbeat', { timestamp: new Date().toISOString() });
      });

      socket.on('heartbeat-ack', (data) => {
        // Connection is healthy
        setConnectionQuality('good');
      });

      socket.on('pong', (data) => {
        const now = Date.now();
        const pingTime = now - parseInt(data.clientTimestamp);
        setLastPingTime(pingTime);
        
        // Update connection quality based on ping time
        if (pingTime < 100) {
          setConnectionQuality('good');
        } else if (pingTime < 500) {
          setConnectionQuality('poor');
        } else {
          setConnectionQuality('poor');
        }
      });

      // Error handling with structured error responses
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        setConnectionError(error.message || 'Unknown error');
        
        if (!error.retryable) {
          // Don't retry for non-retryable errors
          setConnectionError(`${error.message} (Code: ${error.code})`);
        }
      });

      // Chat event handlers
      socket.on('message-received', (message: ChatMessage) => {
        onMessageReceived?.(message);
      });

      socket.on('ai-response-start', (sessionId: string) => {
        onAiResponseStart?.(sessionId);
      });

      socket.on('ai-response-chunk', (data: { sessionId: string; chunk: string }) => {
        onAiResponseChunk?.(data);
      });

      socket.on('ai-response-complete', (message: ChatMessage) => {
        onAiResponseComplete?.(message);
      });

      socket.on('file-processing-status', (status: FileProcessingStatus) => {
        onFileProcessingStatus?.(status);
      });

      socket.on('url-processing-status', (status: UrlProcessingStatus) => {
        onUrlProcessingStatus?.(status);
      });

      socket.on('support-joined', (data: SupportJoinedData) => {
        onSupportJoined?.(data);
      });

      socket.on('support-left', (data: SupportLeftData) => {
        onSupportLeft?.(data);
      });

      socket.on('typing-indicator', (data: TypingIndicatorData) => {
        onTypingIndicator?.(data);
      });

      socket.on('session-updated', (session: ChatSession) => {
        onSessionUpdated?.(session);
      });

      socket.on('escalation-suggested', (data: { sessionId: string; reason: string; message: string }) => {
        onEscalationSuggested?.(data);
      });

    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setConnectionError('Failed to initialize connection');
    }
  }, [
    onMessageReceived,
    onAiResponseStart,
    onAiResponseChunk,
    onAiResponseComplete,
    onFileProcessingStatus,
    onUrlProcessingStatus,
    onSupportJoined,
    onSupportLeft,
    onTypingIndicator,
    onSessionUpdated,
    onConnectionStatusChange,
    onEscalationSuggested
  ]);

  // Reconnection logic
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setConnectionError('Maximum reconnection attempts reached');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
      initializeSocket();
    }, delay);
  }, [initializeSocket]);

  // Helper functions for connection management
  const processMessageQueue = useCallback(() => {
    if (socketRef.current?.connected && messageQueue.current.length > 0) {
      console.log(`Processing ${messageQueue.current.length} queued messages`);
      
      messageQueue.current.forEach(queuedMessage => {
        socketRef.current?.emit(queuedMessage.event, queuedMessage.data);
      });
      
      messageQueue.current = [];
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    
    // Monitor for heartbeat requests from server
    heartbeatTimeoutRef.current = setTimeout(() => {
      if (socketRef.current?.connected) {
        console.warn('No heartbeat received from server, connection may be stale');
        setConnectionQuality('poor');
      }
    }, 90000); // 90 seconds timeout
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  const startPingMonitoring = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    // Send ping every 30 seconds to monitor connection quality
    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const timestamp = Date.now().toString();
        socketRef.current.emit('ping', { timestamp });
      }
    }, 30000);
  }, []);

  const clearPingMonitoring = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const queueMessage = useCallback((event: string, data: any) => {
    messageQueue.current.push({ event, data, timestamp: Date.now() });
    
    // Limit queue size to prevent memory issues
    if (messageQueue.current.length > 100) {
      messageQueue.current = messageQueue.current.slice(-50);
    }
  }, []);

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [initializeSocket]);

  // Socket methods
  const joinSession = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-session', sessionId);
    }
  }, []);

  const sendMessage = useCallback(async (data: SendMessageData) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current?.connected) {
        // Queue message for when connection is restored
        queueMessage('send-message', data);
        reject(new Error('Socket not connected - message queued for retry'));
        return;
      }

      socketRef.current.emit('send-message', data, (response: any) => {
        if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  }, [queueMessage]);

  const uploadFile = useCallback(async (data: FileUploadData) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Convert file to base64 for transmission
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = {
          sessionId: data.sessionId,
          messageId: data.messageId,
          fileName: data.file.name,
          fileType: data.file.type,
          fileSize: data.file.size,
          fileData: reader.result as string
        };

        socketRef.current!.emit('upload-file', fileData, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to upload file'));
          }
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(data.file);
    });
  }, []);

  const processUrl = useCallback(async (data: UrlProcessData) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('process-url', data, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to process URL'));
        }
      });
    });
  }, []);

  const startTyping = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing-start', { sessionId });
    }
  }, []);

  const stopTyping = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing-stop', { sessionId });
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    reconnectAttempts.current = 0;
    setConnectionError(null);
    initializeSocket();
  }, [initializeSocket]);

  return {
    isConnected,
    connectionError,
    connectionQuality,
    lastPingTime,
    queuedMessageCount: messageQueue.current.length,
    joinSession,
    sendMessage,
    uploadFile,
    processUrl,
    startTyping,
    stopTyping,
    reconnect
  };
}