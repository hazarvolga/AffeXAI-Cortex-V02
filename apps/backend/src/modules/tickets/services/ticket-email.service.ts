import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import type { SendMailOptions } from '../../mail/interfaces/mail-service.interface';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { User } from '../../users/entities/user.entity';
import { MailChannel } from '../../mail/interfaces/mail-service.interface';
import { SettingsService } from '../../settings/settings.service';

/**
 * Ticket Email Service
 * Handles all email notifications for ticket-related events
 */
@Injectable()
export class TicketEmailService {
  private readonly logger = new Logger(TicketEmailService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly mailService: MailService,
    private readonly settingsService: SettingsService,
    @InjectRepository(Ticket) private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage) private readonly messageRepository: Repository<TicketMessage>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  }

  private async freshTicket(input: Ticket): Promise<Ticket> {
    if (!input?.id || !input.tenantId) throw new ServiceUnavailableException('Ticket email delivery unavailable');
    const ticket=await this.ticketRepository.findOne({where:{id:input.id,tenantId:input.tenantId},relations:['user','assignedTo','category']});
    if(!ticket)throw new ServiceUnavailableException('Ticket email delivery unavailable');
    return ticket;
  }

  private async recipient(ticket: Ticket, candidate: User, customerOnly=false): Promise<User> {
    if(!candidate?.id || candidate.tenantId!==ticket.tenantId || (customerOnly && candidate.id!==ticket.userId))throw new ServiceUnavailableException('Ticket email delivery unavailable');
    const user=await this.userRepository.findOne({where:{id:candidate.id,tenantId:ticket.tenantId,isActive:true,deletedAt:IsNull()}});
    if(!user?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email))throw new ServiceUnavailableException('Ticket email delivery unavailable');
    return user;
  }

  private async freshMessage(ticket: Ticket, input: TicketMessage): Promise<TicketMessage> {
    if (!input?.id) throw new ServiceUnavailableException('Ticket email delivery unavailable');
    const message = await this.messageRepository.findOne({
      where: { id: input.id, ticketId: ticket.id, tenantId: ticket.tenantId },
      relations: ['author'],
    });
    if (!message) throw new ServiceUnavailableException('Ticket email delivery unavailable');
    return message;
  }

  private async checkedSend(ticket: Ticket, options: SendMailOptions): Promise<void> {
    const result=await this.mailService.sendMail(options,ticket.tenantId);
    if(result?.success!==true)throw new ServiceUnavailableException('Ticket email delivery unavailable');
  }

  /**
   * Send email when a new ticket is created
   * Sends to: Customer, Assigned User (if any), Support Managers
   */
  async sendTicketCreatedEmail(
    ticket: Ticket,
    customer: User,
    assignedUser?: User,
    supportManagers?: User[],
  ): Promise<void> {
    try {
      ticket=await this.freshTicket(ticket);
      customer=await this.recipient(ticket,customer,true);
      if(assignedUser)assignedUser=await this.recipient(ticket,assignedUser);
      if(supportManagers)supportManagers=await Promise.all(supportManagers.map(user=>this.recipient(ticket,user)));

      const customerTicketUrl = `${this.baseUrl}/portal/support/${ticket.id}`;
      const adminTicketUrl = `${this.baseUrl}/admin/support/${ticket.id}`;

      // Fetch site settings for email branding
      // Need site settings for footers/branding
      // We use ticket.tenantId for proper branding context
      const siteSettings = await this.settingsService.getSiteSettings(ticket.tenantId);

      // Get system domain from settings
      // We use ticket.tenantId for proper branding/domain context
      const domain = await this.settingsService.getDomain(ticket.tenantId);

      // Generate email threading headers for proper conversation threading
      const messageId = `<ticket-${ticket.id}-created-${Date.now()}@${domain}>`;

      // Reply-To address for email threading (support team can reply directly)
      const ticketReplyAddress = `ticket-${ticket.id}@${domain}`;

      // 1. Send to Customer (using customer-specific template)
      await this.checkedSend(ticket,{
        to: { email: customer.email, name: `${customer.firstName} ${customer.lastName}` },
        subject: `Destek Talebiniz Oluşturuldu: ${ticket.subject}`,
        template: 'ticket-created-customer',
        channel: MailChannel.TRANSACTIONAL,
        headers: {
          'Message-ID': messageId,
          'X-Ticket-ID': ticket.id.toString(),
        },
        context: {
          customerName: `${customer.firstName} ${customer.lastName}` || customer.email,
          displayNumber: ticket.displayNumber,
          subject: ticket.subject,
          priority: ticket.priority,
          ticketUrl: customerTicketUrl,
          siteSettings,
        },
      });

      // 2. Send to Assigned User (using support-specific template)
      if (assignedUser) {
        await this.checkedSend(ticket,{
          to: { email: assignedUser.email, name: `${assignedUser.firstName} ${assignedUser.lastName}` },
          subject: `Yeni Destek Talebi Atandı: ${ticket.subject}`,
          template: 'ticket-created-support',
          channel: MailChannel.TRANSACTIONAL,
          replyTo: { email: ticketReplyAddress, name: `Ticket ${ticket.displayNumber}` },
          headers: {
            'Message-ID': messageId,
            'X-Ticket-ID': ticket.id.toString(),
            'References': messageId,
          },
          context: {
            supportUserName: `${assignedUser.firstName} ${assignedUser.lastName}`,
            displayNumber: ticket.displayNumber,
            subject: ticket.subject,
            priority: ticket.priority,
            ticketUrl: adminTicketUrl,
            isAssignedUser: true,
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerEmail: customer.email,
            categoryName: ticket.category?.name || '',
            ticketDescription: ticket.description,
            siteSettings,
          },
        });
      }

      // 3. Send to Support Managers
      if (supportManagers && supportManagers.length > 0) {
        for (const manager of supportManagers) {
          // Skip if manager is also the assigned user (avoid duplicate)
          if (assignedUser && manager.id === assignedUser.id) {
            continue;
          }

          await this.checkedSend(ticket,{
            to: { email: manager.email, name: `${manager.firstName} ${manager.lastName}` },
            subject: `Yeni Destek Talebi: ${ticket.subject}`,
            template: 'ticket-created-support',
            channel: MailChannel.TRANSACTIONAL,
            replyTo: { email: ticketReplyAddress, name: `Ticket ${ticket.displayNumber}` },
            headers: {
              'Message-ID': messageId,
              'X-Ticket-ID': ticket.id.toString(),
              'References': messageId,
            },
            context: {
              supportUserName: `${manager.firstName} ${manager.lastName}`,
              displayNumber: ticket.displayNumber,
              subject: ticket.subject,
              priority: ticket.priority,
              ticketUrl: adminTicketUrl,
              isAssignedUser: false,
              customerName: `${customer.firstName} ${customer.lastName}`,
              customerEmail: customer.email,
              categoryName: ticket.category?.name || '',
              ticketDescription: ticket.description,
              siteSettings,
            },
          });
        }
      }
    } catch {
      this.logger.error('Ticket email delivery failed');
      throw new ServiceUnavailableException('Ticket email delivery unavailable');
    }
  }

  /**
   * Send email when a ticket is assigned to an agent
   */
  async sendTicketAssignedEmail(
    ticket: Ticket,
    assignedTo: User,
    assignedBy: User,
  ): Promise<void> {
    try {
      ticket=await this.freshTicket(ticket);
      assignedTo=await this.recipient(ticket,assignedTo);
      assignedBy=await this.recipient(ticket,assignedBy);
      const ticketUrl = `${this.baseUrl}/admin/support/${ticket.id}`;

      await this.checkedSend(ticket,{
        to: { email: assignedTo.email, name: `${assignedTo.firstName} ${assignedTo.lastName}` },
        subject: `Ticket Assigned: ${ticket.subject}`,
        template: 'ticket-assigned',
        channel: MailChannel.TRANSACTIONAL,
        context: {
          agentName: `${assignedTo.firstName} ${assignedTo.lastName}` || assignedTo.email,
          ticketId: ticket.id,
          ticketSubject: ticket.subject,
          ticketPriority: ticket.priority,
          ticketStatus: ticket.status,
          assignedByName: `${assignedBy.firstName} ${assignedBy.lastName}` || assignedBy.email,
          ticketUrl,
        },
      });
    } catch {
      this.logger.error('Ticket email delivery failed');
      throw new ServiceUnavailableException('Ticket email delivery unavailable');
    }
  }

  /**
   * Send email when a new message is added to a ticket
   */
  async sendNewMessageEmail(
    ticket: Ticket,
    message: TicketMessage,
    recipient: User,
    isCustomerMessage: boolean,
  ): Promise<void> {
    try {
      ticket=await this.freshTicket(ticket);
      message=await this.freshMessage(ticket,message);
      if(message.isInternal && recipient.id===ticket.userId)throw new ServiceUnavailableException('Ticket email delivery unavailable');
      recipient=await this.recipient(ticket,recipient,!isCustomerMessage);
      const ticketUrl = isCustomerMessage
        ? `${this.baseUrl}/admin/support/${ticket.id}`
        : `${this.baseUrl}/portal/support/${ticket.id}`;

      const subject = isCustomerMessage
        ? `Yeni Müşteri Mesajı - ${ticket.displayNumber}: ${ticket.subject}`
        : `Yeni Yanıt - ${ticket.displayNumber}: ${ticket.subject}`;

      // Get system domain from settings
      // Using ticket.tenantId for domain context
      const domain = await this.settingsService.getDomain(ticket.tenantId);

      // Generate threading headers for message replies
      const originalMessageId = `<ticket-${ticket.id}-created-${ticket.createdAt.getTime()}@${domain}>`;
      const newMessageId = `<ticket-${ticket.id}-message-${message.id}-${Date.now()}@${domain}>`;

      // Reply-To address for email threading
      const ticketReplyAddress = `ticket-${ticket.id}@${domain}`;

      // Get site settings for email template
      // Using ticket.tenantId for branding
      const siteSettings = await this.settingsService.getSiteSettings(ticket.tenantId);

      await this.checkedSend(ticket,{
        to: { email: recipient.email, name: `${recipient.firstName} ${recipient.lastName}` },
        subject,
        template: 'ticket-new-message',
        channel: MailChannel.TRANSACTIONAL,
        replyTo: { email: ticketReplyAddress, name: `Ticket ${ticket.displayNumber}` },
        headers: {
          'Message-ID': newMessageId,
          'In-Reply-To': originalMessageId,
          'References': originalMessageId,
          'X-Ticket-ID': ticket.id.toString(),
        },
        context: {
          recipientName: `${recipient.firstName} ${recipient.lastName}` || recipient.email,
          senderName: message.author ? `${message.author.firstName} ${message.author.lastName}` : 'Destek Ekibi',
          displayNumber: ticket.displayNumber,
          subject: ticket.subject,
          messageContent: message.content,
          ticketUrl,
          isCustomer: !isCustomerMessage, // Recipient is customer if message was sent by support
          siteSettings,
        },
      });
    } catch {
      this.logger.error('Ticket email delivery failed');
      throw new ServiceUnavailableException('Ticket email delivery unavailable');
    }
  }

  /**
   * Send email when a ticket is resolved (with CSAT survey)
   */
  async sendTicketResolved(
    ticket: Ticket,
    surveyToken?: string,
  ): Promise<void> {
    try {
      ticket=await this.freshTicket(ticket);
      const customer = await this.recipient(ticket,ticket.user,true);
      const ticketUrl = `${this.baseUrl}/portal/support/${ticket.id}`;
      const surveyUrl = surveyToken
        ? `${this.baseUrl}/survey/${surveyToken}`
        : null;

      const result = await this.mailService.sendMail({
        to: { email: customer.email, name: `${customer.firstName} ${customer.lastName}` },
        subject: `Ticket Resolved: ${ticket.subject}`,
        template: 'csat-survey',
        channel: MailChannel.TRANSACTIONAL,
        context: {
          customerName: `${customer.firstName} ${customer.lastName}` || customer.email,
          ticketTitle: ticket.subject,
          ticketId: ticket.id,
          surveyUrl,
          agentName: ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Destek Ekibi',
          siteSettings: {
            siteName: process.env.SITE_NAME || 'AffeXAI Cortex',
            siteUrl: this.baseUrl,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
          },
        },
      }, ticket.tenantId);

      if (result?.success !== true) throw new ServiceUnavailableException('Survey email delivery unavailable');
      this.logger.log('Ticket survey email accepted by delivery provider');
    } catch {
      this.logger.error('Ticket survey email delivery failed');
      throw new ServiceUnavailableException('Survey email delivery unavailable');
    }
  }

  /**
   * DEPRECATED: Use sendTicketResolved instead
   * Send email when a ticket is resolved
   */
  async sendTicketResolvedEmail(
    ticket: Ticket,
    customer: User,
    resolvedBy: User,
  ): Promise<void> {
    try {
      ticket=await this.freshTicket(ticket);
      customer=await this.recipient(ticket,customer,true);
      resolvedBy=await this.recipient(ticket,resolvedBy);
      const ticketUrl = `${this.baseUrl}/portal/support/${ticket.id}`;
      const feedbackUrl = `${this.baseUrl}/portal/support/${ticket.id}/feedback`;

      await this.checkedSend(ticket,{
        to: { email: customer.email, name: `${customer.firstName} ${customer.lastName}` },
        subject: `Ticket Resolved: ${ticket.subject}`,
        template: 'ticket-resolved',
        channel: MailChannel.TRANSACTIONAL,
        context: {
          customerName: `${customer.firstName} ${customer.lastName}` || customer.email,
          ticketId: ticket.id,
          ticketSubject: ticket.subject,
          resolvedByName: `${resolvedBy.firstName} ${resolvedBy.lastName}` || 'Support Team',
          resolutionTime: ticket.resolutionTimeHours,
          ticketUrl,
          feedbackUrl,
        },
      });
    } catch {
      this.logger.error('Ticket email delivery failed');
      throw new ServiceUnavailableException('Ticket email delivery unavailable');
    }
  }

  /**
   * Send SLA breach alert to support team
   */
  async sendSLABreachAlert(
    ticket: Ticket,
    breachType: 'first_response' | 'resolution',
  ): Promise<void> {
    try {
      ticket=await this.freshTicket(ticket);
      const assigned=await this.recipient(ticket,ticket.assignedTo);
      const ticketUrl = `${this.baseUrl}/admin/support/${ticket.id}`;

      await this.checkedSend(ticket,{
        to: { email: assigned.email, name: `${assigned.firstName} ${assigned.lastName}` },
        subject: `⚠️ SLA Breach Alert: ${ticket.subject}`,
        template: 'sla-breach-alert',
        channel: MailChannel.TRANSACTIONAL,
        context: {
          ticketId: ticket.id,
          ticketSubject: ticket.subject,
          ticketPriority: ticket.priority,
          breachType,
          ticketUrl,
          assignedTo: ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Unassigned',
        },
      });
    } catch {
      this.logger.error('Ticket email delivery failed');
      throw new ServiceUnavailableException('Ticket email delivery unavailable');
    }
  }

  /**
   * Send SLA approaching alert (proactive notification)
   */
  async sendSLAApproachingAlert(
    ticket: Ticket,
    remainingHours: number,
  ): Promise<void> {
    try {
      ticket=await this.freshTicket(ticket);
      const assigned=await this.recipient(ticket,ticket.assignedTo);
const ticketUrl = `${this.baseUrl}/admin/support/${ticket.id}`;

      await this.checkedSend(ticket,{
        to: { email: assigned.email, name: `${assigned.firstName} ${assigned.lastName}` },
        subject: `⏰ SLA Alert: ${ticket.subject} - ${remainingHours}h remaining`,
        template: 'sla-approaching-alert',
        channel: MailChannel.TRANSACTIONAL,
        context: {
          agentName: `${assigned.firstName} ${assigned.lastName}` || assigned.email,
          ticketId: ticket.id,
          ticketSubject: ticket.subject,
          ticketPriority: ticket.priority,
          remainingHours,
          ticketUrl,
        },
      });
    } catch {
      this.logger.error('Ticket email delivery failed');
      throw new ServiceUnavailableException('Ticket email delivery unavailable');
    }
  }

  /**
   * Send email when ticket is escalated
   */
  async sendTicketEscalatedEmail(
    ticket: Ticket,
    escalatedTo: User,
    escalationLevel: number,
    reason: string,
  ): Promise<void> {
    try {
      ticket=await this.freshTicket(ticket);
      escalatedTo=await this.recipient(ticket,escalatedTo);
      const ticketUrl = `${this.baseUrl}/admin/support/${ticket.id}`;

      await this.checkedSend(ticket,{
        to: { email: escalatedTo.email, name: `${escalatedTo.firstName} ${escalatedTo.lastName}` },
        subject: `🚨 Escalated Ticket (Level ${escalationLevel}): ${ticket.subject}`,
        template: 'ticket-escalated',
        channel: MailChannel.TRANSACTIONAL,
        context: {
          agentName: `${escalatedTo.firstName} ${escalatedTo.lastName}` || escalatedTo.email,
          ticketId: ticket.id,
          ticketSubject: ticket.subject,
          ticketPriority: ticket.priority,
          escalationLevel,
          reason,
          ticketUrl,
        },
      });
    } catch {
      this.logger.error('Ticket email delivery failed');
      throw new ServiceUnavailableException('Ticket email delivery unavailable');
    }
  }

}
