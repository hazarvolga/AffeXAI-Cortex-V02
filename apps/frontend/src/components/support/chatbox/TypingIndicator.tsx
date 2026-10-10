'use client';

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  userName?: string;
  userType?: 'ai' | 'support';
  className?: string;
}

export function TypingIndicator({ 
  userName = 'AI Asistan', 
  userType = 'ai',
  className 
}: TypingIndicatorProps) {
  const isAI = userType === 'ai';
  
  return (
    <div className={cn("flex space-x-3", className)}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={cn(
          "text-xs",
          isAI ? "bg-secondary text-secondary-foreground" : "bg-blue-500 text-white"
        )}>
          {isAI ? <Bot className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      {/* Typing Indicator */}
      <div className="flex-1 max-w-[80%]">
        {/* User Name */}
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {userName}
          </span>
          <span className="text-xs text-muted-foreground">yazıyor...</span>
        </div>
        
        {/* Typing Animation */}
        <Card className="bg-muted">
          <CardContent className="p-3">
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}