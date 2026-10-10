import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { ChatSessionService } from './chat-session.service';
import { ChatMessageService } from './chat-message.service';

export interface ChatActor { id: string; tenantId: string; roleNames?: string[]; isPlatformAdmin?: boolean; }

/** Called inside the authenticated tenant context before reading content or invoking a provider. */
export async function authorizeChatSession(
  sessions: ChatSessionService, messages: ChatMessageService, user: ChatActor,
  sessionId: string, messageId?: string,
): Promise<void> {
  if (!user?.id || !user.tenantId) throw new ForbiddenException('Authenticated tenant required');
  if (!isUUID(sessionId) || (messageId !== undefined && !isUUID(messageId))) throw new BadRequestException('Invalid chat identity');
  const session = await sessions.getSession(sessionId);
  const staff = user.isPlatformAdmin === true || (user.roleNames || []).some(role =>
    ['admin', 'support', 'support_manager', 'support_agent'].includes(role.toLowerCase()));
  if (session.tenantId !== user.tenantId || (session.userId !== user.id && !staff)) {
    throw new ForbiddenException('Chat session access denied');
  }
  if (messageId) {
    const message = await messages.getMessage(messageId);
    if (message.tenantId !== user.tenantId || message.sessionId !== sessionId) {
      throw new ForbiddenException('Message does not belong to this chat session');
    }
  }
}
