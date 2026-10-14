"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api/api-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Send,
  Minimize2,
  Maximize2,
  X,
  Bot,
  User,
  Loader2,
  Paperclip,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageComponent } from "./ChatMessage";
import { FileUploadArea } from "./FileUploadArea";
import { UrlInputArea } from "./UrlInputArea";
import { TypingIndicator } from "./TypingIndicator";
import {
  ContextSourceVisualization,
  ContextSource,
} from "./ContextSourceVisualization";
import { ConnectionStatus } from "./ConnectionStatus";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useAsyncEffect } from "@/hooks/use-async-effect";

/** Client-side id for optimistic chat messages; the server assigns the real one. */
const generateId = () => Math.random().toString(36).slice(2, 11);

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: "user" | "ai" | "support";
  senderId?: string;
  content: string;
  messageType: "text" | "file" | "url" | "system";
  metadata?: {
    aiModel?: string;
    processingTime?: number;
    contextSources?: ContextSource[];
    confidence?: number;
    supportUserId?: string;
    supportUserName?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    url?: string;
    streaming?: boolean;
    responseType?: string;
    escalation?: boolean;
    escalatedAt?: Date;
  };
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  sessionType: "support" | "general";
  status: "active" | "closed" | "transferred";
  title?: string;
  metadata?: {
    aiProvider?: string;
    modelUsed?: string;
    contextSources?: number;
    messageCount?: number;
    supportAssigned?: boolean;
    customerSatisfaction?: number;
    fallback?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

interface ChatBoxProps {
  sessionType?: "support" | "general";
  className?: string;
  onSessionCreate?: (session: ChatSession) => void;
  onMessageSent?: (message: ChatMessage) => void;
  embedded?: boolean;
  showHeader?: boolean;
  height?: string;
  initialMessage?: string;
}

export function ChatBox({
  sessionType = "support",
  className,
  onSessionCreate,
  onMessageSent,
  embedded = false,
  showHeader = true,
  height = "600px",
  initialMessage = "",
}: ChatBoxProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(initialMessage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showEscalationSuggestion, setShowEscalationSuggestion] =
    useState(false);
  const [escalationReason, setEscalationReason] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat socket connection
  const {
    isConnected,
    connectionError,
    connectionQuality,
    lastPingTime,
    queuedMessageCount,
    sendMessage,
    joinSession,
    uploadFile,
    processUrl,
    startTyping,
    stopTyping,
    reconnect,
  } = useChatSocket({
    onMessageReceived: handleMessageReceived,
    onAiResponseStart: handleAiResponseStart,
    onAiResponseChunk: handleAiResponseChunk,
    onAiResponseComplete: handleAiResponseComplete,
    onTypingIndicator: handleTypingIndicator,
    onSessionUpdated: handleSessionUpdated,
    onEscalationSuggested: handleEscalationSuggested,
  });

  // Focus input when expanded
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);

      // Create session via API based on session type
      let newSession: ChatSession;

      if (sessionType === "general") {
        // Create general communication session
        const response = await apiFetch("/api/chat/general/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({
            title: "Genel Sohbet",
            language: "tr",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create general session");
        }

        const data = await response.json();
        newSession = data.session;

        // Set conversation starters if available
        if (data.conversationStarters) {
          // You could show these as quick reply buttons
          console.log("Conversation starters:", data.conversationStarters);
        }
      } else {
        // Create support session (existing logic)
        newSession = {
          id: generateId(),
          userId: "current-user-id", // This should come from auth context
          sessionType,
          status: "active",
          title: "Destek Sohbeti",
          metadata: {
            aiProvider: "openai",
            modelUsed: "gpt-4o",
            contextSources: 0,
            messageCount: 0,
            supportAssigned: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      setSession(newSession);
      onSessionCreate?.(newSession);

      // Join the session via WebSocket
      if (isConnected) {
        joinSession(newSession.id);
      }

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: generateId(),
        sessionId: newSession.id,
        senderType: "ai",
        content:
          sessionType === "support"
            ? "Merhaba! Size nasıl yardımcı olabilirim? Sorularınızı sorabilir, dosya yükleyebilir veya web sayfası linklerini paylaşabilirsiniz."
            : "Merhaba! Platform hakkında genel sorularınız için buradayım. Size nasıl yardımcı olabilirim?",
        messageType: "text",
        metadata: {
          aiModel:
            sessionType === "general" ? "general-communication" : "gpt-4o",
          confidence: 1.0,
          responseType: "welcome",
        },
        createdAt: new Date(),
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Failed to initialize chat session:", error);

      // Fallback to local session creation
      const fallbackSession: ChatSession = {
        id: generateId(),
        userId: "current-user-id",
        sessionType,
        status: "active",
        title: `${sessionType === "support" ? "Destek" : "Genel"} Sohbeti`,
        metadata: {
          aiProvider: "openai",
          modelUsed:
            sessionType === "general" ? "general-communication" : "gpt-4o",
          contextSources: 0,
          messageCount: 0,
          supportAssigned: false,
          fallback: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setSession(fallbackSession);
      onSessionCreate?.(fallbackSession);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize session on mount
  useAsyncEffect(() => {
    initializeSession();
  }, [sessionType]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !session || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      sessionId: session.id,
      senderType: "user",
      senderId: session.userId,
      content: currentMessage.trim(),
      messageType: "text",
      createdAt: new Date(),
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      // Send message via WebSocket
      if (isConnected) {
        await sendMessage({
          sessionId: session.id,
          content: userMessage.content,
          messageType: "text",
        });
      }

      onMessageSent?.(userMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
      // TODO: Add error handling UI
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);

    // Handle typing indicators
    if (e.target.value && !isTyping) {
      setIsTyping(true);
      startTyping(session?.id || "");
    } else if (!e.target.value && isTyping) {
      setIsTyping(false);
      stopTyping(session?.id || "");
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!session) return;

    for (const file of files) {
      try {
        setIsLoading(true);

        // Create file message
        const fileMessage: ChatMessage = {
          id: generateId(),
          sessionId: session.id,
          senderType: "user",
          senderId: session.userId,
          content: `Dosya yüklendi: ${file.name}`,
          messageType: "file",
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          },
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, fileMessage]);

        // Upload file via WebSocket
        if (isConnected) {
          await uploadFile({
            sessionId: session.id,
            file,
            messageId: fileMessage.id,
          });
        }
      } catch (error) {
        console.error("Failed to upload file:", error);
      } finally {
        setIsLoading(false);
      }
    }

    setShowFileUpload(false);
  };

  const handleUrlProcess = async (url: string) => {
    if (!session) return;

    try {
      setIsLoading(true);

      // Create URL message
      const urlMessage: ChatMessage = {
        id: generateId(),
        sessionId: session.id,
        senderType: "user",
        senderId: session.userId,
        content: `URL paylaşıldı: ${url}`,
        messageType: "url",
        metadata: {
          url,
        },
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, urlMessage]);

      // Process URL via WebSocket
      if (isConnected) {
        await processUrl({
          sessionId: session.id,
          url,
          messageId: urlMessage.id,
        });
      }
    } catch (error) {
      console.error("Failed to process URL:", error);
    } finally {
      setIsLoading(false);
      setShowUrlInput(false);
    }
  };

  // WebSocket event handlers
  function handleMessageReceived(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
  }

  function handleAiResponseStart(sessionId: string) {
    setIsLoading(true);
  }

  function handleAiResponseChunk(data: { sessionId: string; chunk: string }) {
    // Handle streaming response chunks
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      if (
        lastMessage &&
        lastMessage.senderType === "ai" &&
        lastMessage.metadata?.streaming
      ) {
        return [
          ...prev.slice(0, -1),
          {
            ...lastMessage,
            content: lastMessage.content + data.chunk,
          },
        ];
      } else {
        // Create new streaming message
        const streamingMessage: ChatMessage = {
          id: generateId(),
          sessionId: data.sessionId,
          senderType: "ai",
          content: data.chunk,
          messageType: "text",
          metadata: {
            streaming: true,
            aiModel: "gpt-4o",
          },
          createdAt: new Date(),
        };
        return [...prev, streamingMessage];
      }
    });
  }

  function handleAiResponseComplete(message: ChatMessage) {
    setIsLoading(false);
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      if (
        lastMessage &&
        lastMessage.senderType === "ai" &&
        lastMessage.metadata?.streaming
      ) {
        return [
          ...prev.slice(0, -1),
          {
            ...message,
            metadata: {
              ...message.metadata,
              streaming: false,
            },
          },
        ];
      }
      return prev;
    });
  }

  function handleTypingIndicator(data: {
    sessionId: string;
    userId: string;
    userName: string;
    isTyping: boolean;
  }) {
    if (data.isTyping) {
      setTypingUser(data.userName);
    } else {
      setTypingUser(null);
    }
  }

  function handleSessionUpdated(updatedSession: ChatSession) {
    setSession(updatedSession);
  }

  function handleEscalationSuggested(data: {
    sessionId: string;
    reason: string;
    message: string;
  }) {
    if (data.sessionId === session?.id) {
      setShowEscalationSuggestion(true);
      setEscalationReason(data.reason);
    }
  }

  const handleEscalateToSupport = async () => {
    if (!session) return;

    try {
      setIsLoading(true);

      // Send escalation via WebSocket
      if (isConnected) {
        // Use WebSocket for real-time escalation
        const escalationData = {
          sessionId: session.id,
          reason: escalationReason || "user-requested",
          notes: "Kullanıcı destek ekibiyle iletişime geçmek istiyor",
        };

        // Emit escalation event (this would be handled by the WebSocket)
        // For now, we'll make an API call
        const response = await apiFetch(
          `/api/chat/general/sessions/${session.id}/escalate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            body: JSON.stringify(escalationData),
          },
        );

        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
          setShowEscalationSuggestion(false);
          setEscalationReason(null);

          // Add system message
          const escalationMessage: ChatMessage = {
            id: generateId(),
            sessionId: session.id,
            senderType: "ai",
            content:
              "Sohbet destek ekibine yönlendirildi. Bir destek temsilcisi kısa süre içinde size yardımcı olacak.",
            messageType: "system",
            metadata: {
              escalation: true,
              escalatedAt: new Date(),
            },
            createdAt: new Date(),
          };

          setMessages((prev) => [...prev, escalationMessage]);
        }
      }
    } catch (error) {
      console.error("Failed to escalate to support:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show minimized state in embedded mode
  if (isMinimized && !embedded) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full h-12 w-12 shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        {!isConnected && (
          <Badge variant="destructive" className="absolute -top-2 -left-2">
            Bağlantı Yok
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        embedded
          ? "w-full h-full"
          : "fixed bottom-4 right-4 z-50 transition-all duration-300",
        !embedded && (isExpanded ? "inset-4" : `w-96`),
        className,
      )}
      style={embedded ? { height } : undefined}
    >
      <Card
        className={cn(
          "h-full flex flex-col",
          embedded ? "shadow-none border-0" : "shadow-2xl",
        )}
      >
        {showHeader && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {sessionType === "support" ? "AI Destek" : "AI Asistan"}
                </CardTitle>
              </div>
              <div className="flex items-center space-x-1">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500" : "bg-red-500",
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? "Bağlı" : "Bağlantı Yok"}
                </span>
              </div>
            </div>
            {!embedded && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8"
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(true)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
        )}

        {showHeader && <Separator />}

        {/* Connection Status */}
        <ConnectionStatus
          isConnected={isConnected}
          connectionQuality={connectionQuality}
          connectionError={connectionError}
          lastPingTime={lastPingTime}
          queuedMessageCount={queuedMessageCount}
          onReconnect={reconnect}
        />

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessageComponent key={message.id} message={message} />
              ))}
              {typingUser && <TypingIndicator userName={typingUser} />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />

          {/* File Upload Area */}
          {showFileUpload && (
            <div className="p-4 border-t">
              <FileUploadArea
                onFilesSelected={handleFileUpload}
                onCancel={() => setShowFileUpload(false)}
              />
            </div>
          )}

          {/* URL Input Area */}
          {showUrlInput && (
            <div className="p-4 border-t">
              <UrlInputArea
                onUrlSubmit={handleUrlProcess}
                onCancel={() => setShowUrlInput(false)}
              />
            </div>
          )}

          {/* Escalation Suggestion */}
          {showEscalationSuggestion && sessionType === "general" && (
            <div className="p-4 border-t bg-blue-50 dark:bg-blue-950">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Destek Ekibiyle İletişim
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Bu konuda size daha iyi yardımcı olabilmek için destek
                    ekibimizle iletişime geçmenizi öneriyorum.
                  </p>
                  <div className="flex space-x-2 mt-3">
                    <Button
                      size="sm"
                      onClick={handleEscalateToSupport}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Destek Ekibiyle İletişim
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowEscalationSuggestion(false)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      Devam Et
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFileUpload(!showFileUpload)}
                disabled={isLoading}
                className="h-9 w-9"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowUrlInput(!showUrlInput)}
                disabled={isLoading}
                className="h-9 w-9"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={currentMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Mesajınızı yazın..."
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {session && (
              <div className="text-xs text-muted-foreground text-center">
                Oturum: {session.id.slice(0, 8)}... • {messages.length} mesaj
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
