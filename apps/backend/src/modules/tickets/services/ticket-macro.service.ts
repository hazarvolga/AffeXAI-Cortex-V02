import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TicketMacro, MacroAction } from '../entities/ticket-macro.entity';
import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { TicketsService } from '../tickets.service';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * Ticket Macro Service
 * Manages bulk actions and predefined workflows
 */

export interface CreateMacroDto {
  name: string;
  description?: string;
  actions: MacroAction[];
  isPublic?: boolean;
  tags?: string[];
}

export interface ExecuteMacroResult {
  success: boolean;
  ticketsAffected: number;
  errors: string[];
}

@Injectable()
export class TicketMacroService {
  private readonly logger = new Logger(TicketMacroService.name);

  constructor(
    @InjectRepository(TicketMacro)
    private readonly macroRepository: Repository<TicketMacro>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private readonly messageRepository: Repository<TicketMessage>,
    private readonly ticketsService: TicketsService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Get active tenant ID from TenantService
   */
  private getActiveTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }

  /**
   * Create a new macro
   */
  async createMacro(createdById: string, dto: CreateMacroDto): Promise<TicketMacro> {
    const tenantId = this.getActiveTenantId();
    const macro = this.macroRepository.create({
      ...dto,
      createdById,
      tenantId,
    });

    await this.macroRepository.save(macro);
    this.logger.log(`Created macro: ${macro.id} - ${macro.name}`);

    return macro;
  }

  /**
   * Update a macro
   */
  async updateMacro(id: string, updates: Partial<CreateMacroDto>): Promise<TicketMacro> {
    const tenantId = this.getActiveTenantId();
    const macro = await this.macroRepository.findOne({ where: { id, tenantId } });

    if (!macro) {
      throw new NotFoundException(`Macro ${id} not found`);
    }

    Object.assign(macro, updates);
    await this.macroRepository.save(macro);

    this.logger.log(`Updated macro: ${macro.id}`);
    return macro;
  }

  /**
   * Delete a macro
   */
  async deleteMacro(id: string): Promise<void> {
    const tenantId = this.getActiveTenantId();
    const result = await this.macroRepository.delete({ id, tenantId });

    if (result.affected === 0) {
      throw new NotFoundException(`Macro ${id} not found`);
    }

    this.logger.log(`Deleted macro: ${id}`);
  }

  /**
   * Get macro by ID
   */
  async getMacro(id: string): Promise<TicketMacro> {
    const tenantId = this.getActiveTenantId();
    const macro = await this.macroRepository.findOne({
      where: { id, tenantId },
      relations: ['createdBy'],
    });

    if (!macro) {
      throw new NotFoundException(`Macro ${id} not found`);
    }

    return macro;
  }

  /**
   * Get all macros
   */
  async getAllMacros(userId?: string): Promise<TicketMacro[]> {
    const tenantId = this.getActiveTenantId();
    const query = this.macroRepository
      .createQueryBuilder('macro')
      .leftJoinAndSelect('macro.createdBy', 'createdBy')
      .where('macro.tenantId = :tenantId', { tenantId })
      .andWhere('macro.isActive = :isActive', { isActive: true });

    if (userId) {
      // Show public macros + user's own macros
      query.andWhere('(macro.isPublic = :isPublic OR macro.createdById = :userId)', {
        isPublic: true,
        userId,
      });
    } else {
      // Show only public macros
      query.andWhere('macro.isPublic = :isPublic', { isPublic: true });
    }

    query.orderBy('macro.usageCount', 'DESC');

    return await query.getMany();
  }

  /**
   * Execute macro on tickets
   */
  async executeMacro(
    macroId: string,
    ticketIds: string[],
    userId: string,
  ): Promise<ExecuteMacroResult> {
    const tenantId = this.getActiveTenantId();
    const macro = await this.getMacro(macroId);
    const tickets = await this.ticketRepository.find({
      where: { id: In(ticketIds), tenantId },
      relations: ['user', 'assignedTo'],
    });

    if (tickets.length === 0) {
      throw new NotFoundException('No tickets found');
    }

    const errors: string[] = [];
    let successCount = 0;

    for (const ticket of tickets) {
      try {
        await this.applyMacroActions(ticket, macro.actions, userId);
        successCount++;
      } catch (error) {
        errors.push(`Ticket ${ticket.id}: ${error.message}`);
        this.logger.error(`Failed to apply macro to ticket ${ticket.id}: ${error.message}`);
      }
    }

    // Update macro usage count
    await this.macroRepository.save({ ...macro, usageCount: macro.usageCount + 1 });

    this.logger.log(`Executed macro ${macroId} on ${successCount}/${tickets.length} tickets`);

    return {
      success: errors.length === 0,
      ticketsAffected: successCount,
      errors,
    };
  }

  /**
   * Apply macro actions to a ticket
   */
  private async applyMacroActions(
    ticket: Ticket,
    actions: MacroAction[],
    userId: string,
  ): Promise<void> {
    const tenantId = this.getActiveTenantId();
    let currentTags = [...(ticket.tags || [])];
    for (const action of actions) {
      switch (action.type) {
        case 'update_status':
          await this.ticketsService.updateStatus(ticket.id, action.value as any, userId);
          break;

        case 'assign':
          await this.ticketsService.assignTo(ticket.id, action.value, userId);
          break;

        case 'add_tag':
          currentTags = [...new Set([...currentTags, action.value])];
          await this.ticketRepository.update({ id: ticket.id, tenantId }, { tags: currentTags });
          break;
        case 'remove_tag':
          currentTags = currentTags.filter(tag => tag !== action.value);
          await this.ticketRepository.update({ id: ticket.id, tenantId }, { tags: currentTags });
          break;
        case 'set_priority':
          await this.ticketRepository.update({ id: ticket.id, tenantId }, { priority: action.value });
          break;

        case 'add_note':
          await this.ticketsService.addMessage(ticket.id, userId, {
            content: action.value,
            isInternal: true,
          });
          break;

        case 'send_email':
          // NOTE: Email sending will use TicketNotificationService when integrated
          this.logger.warn('Email action not yet implemented');
          break;

        default:
          this.logger.warn(`Unknown macro action type: ${action.type}`);
      }
    }
  }

  /**
   * Get popular macros
   */
  async getPopularMacros(limit: number = 10): Promise<TicketMacro[]> {
    const tenantId = this.getActiveTenantId();
    return await this.macroRepository.find({
      where: { isActive: true, isPublic: true, tenantId },
      relations: ['createdBy'],
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get macro statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    public: number;
    totalUsage: number;
  }> {
    const tenantId = this.getActiveTenantId();
    const [total, active, publicMacros] = await Promise.all([
      this.macroRepository.count({ where: { tenantId } }),
      this.macroRepository.count({ where: { isActive: true, tenantId } }),
      this.macroRepository.count({ where: { isPublic: true, tenantId } }),
    ]);

    const allMacros = await this.macroRepository.find({ where: { tenantId } });
    const totalUsage = allMacros.reduce((sum, m) => sum + m.usageCount, 0);

    return {
      total,
      active,
      public: publicMacros,
      totalUsage,
    };
  }
}
