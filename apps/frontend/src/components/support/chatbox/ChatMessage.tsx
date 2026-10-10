'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  User, 
  UserCheck, 
  Clock, 
  FileText, 
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState } from 'react';
import { ContextSourceVisualization, ContextSource } from './ContextSourceVisualization';

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'user' | 'ai' | 'support';
  senderId?: string;
  content: string;
  messageType: 'text' | 'file' | 'url' | 'system';
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
  };
  createdAt: Date;
}

interface ChatMessageProps {
  message: ChatMessage;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export function ChatMessage({ 
  message, 
  showAvatar = true, 
  showTimestamp = true 
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  
  const isUser = message.senderType === 'user';
  const isAI = message.senderType === 'ai';
  const isSupport = message.senderType === 'support';
  const isStreaming = message.metadata?.streaming;

  const getSenderInfo = () => {
    if (isUser) {
      return {
        name: 'Siz',
        avatar: <User className="h-4 w-4" />,
        color: 'bg-primary text-primary-foreground'
      };
    } else if (isAI) {
      return {
        name: 'AI Asistan',
        avatar: <Bot className="h-4 w-4" />,
        color: 'bg-secondary text-secondary-foreground'
      };
    } else if (isSupport) {
      return {
        name: message.metadata?.supportUserName || 'Destek Ekibi',
        avatar: <UserCheck className="h-4 w-4" />,
        color: 'bg-blue-500 text-white'
      };
    }
    return {
      name: 'Sistem',
      avatar: <Bot className="h-4 w-4" />,
      color: 'bg-muted text-muted-foreground'
    };
  };

  const senderInfo = getSenderInfo();

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'file':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-sm">{message.metadata?.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {message.metadata?.fileSize && formatFileSize(message.metadata.fileSize)}
                  {message.metadata?.fileType && ` • ${message.metadata.fileType}`}
                </p>
              </div>
            </div>
            {message.content !== `Dosya yüklendi: ${message.metadata?.fileName}` && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );
      
      case 'url':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <LinkIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-sm">Web Sayfası</p>
                <a 
                  href={message.metadata?.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center space-x-1"
                >
                  <span>{message.metadata?.url}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            {message.content !== `URL paylaşıldı: ${message.metadata?.url}` && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );
      
      case 'system':
        return (
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              {message.content}
            </Badge>
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
              )}
            </p>
            
            {/* Context Sources */}
            {message.metadata?.contextSources && message.metadata.contextSources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-border/50">
                <ContextSourceVisualization 
                  sources={message.metadata.contextSources}
                  maxSources={3}
                  showRelevanceScores={true}
                />
              </div>
            )}
            
            {/* AI Metadata */}
            {isAI && message.metadata && (
              <div className="mt-2 flex items-center space-x-2 text-xs text-muted-foreground">
                {message.metadata.aiModel && (
                  <Badge variant="outline" className="text-xs">
                    {message.metadata.aiModel}
                  </Badge>
                )}
                {message.metadata.confidence && (
                  <Badge variant="outline" className="text-xs">
                    Güven: {Math.round(message.metadata.confidence * 100)}%
                  </Badge>
                )}
                {message.metadata.processingTime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{message.metadata.processingTime}ms</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "flex space-x-3",
      isUser && "flex-row-reverse space-x-reverse"
    )}>
      {/* Avatar */}
      {showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className={cn("text-xs", senderInfo.color)}>
            {senderInfo.avatar}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[80%]",
        isUser && "flex flex-col items-end"
      )}>
        {/* Sender Name & Timestamp */}
        {showAvatar && (
          <div className={cn(
            "flex items-center space-x-2 mb-1",
            isUser && "flex-row-reverse space-x-reverse"
          )}>
            <span className="text-xs font-medium text-muted-foreground">
              {senderInfo.name}
            </span>
            {showTimestamp && (
              <span className="text-xs text-muted-foreground">
                {format(message.createdAt, 'HH:mm', { locale: tr })}
              </span>
            )}
          </div>
        )}
        
        {/* Message Bubble */}
        <Card className={cn(
          "relative group",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
          message.messageType === 'system' && "bg-transparent border-none shadow-none"
        )}>
          <CardContent className={cn(
            "p-3",
            message.messageType === 'system' && "p-1"
          )}>
            {renderMessageContent()}
          </CardContent>
          
          {/* Message Actions */}
          {message.messageType !== 'system' && (
            <div className={cn(
              "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity",
              isUser ? "left-2" : "right-2"
            )}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyMessage}
                className="h-6 w-6"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}