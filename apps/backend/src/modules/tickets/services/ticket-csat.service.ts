import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, Not, MoreThan } from "typeorm";
import { TicketCSAT } from "../entities/ticket-csat.entity";
import { Ticket } from "../entities/ticket.entity";
import { TicketEmailService } from "./ticket-email.service";
import { randomBytes } from "crypto";
import { TenantService } from "../../../core/tenant/tenant.service";

/**
 * CSAT Service
 * Manages customer satisfaction surveys
 */

export interface CSATSurveyData {
  ticketId: string;
  customerId: string;
  rating: number;
  feedback?: string;
  responses?: Record<string, string | number | boolean | null>;
  ipAddress?: string;
  userAgent?: string;
}

export interface CSATStatistics {
  totalResponses: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number }[];
  responseRate: number; // percentage of surveys completed
  satisfactionScore: number; // % of 4-5 star ratings
  promoterScore: number; // NPS-style metric
}

@Injectable()
export class TicketCSATService {
  private readonly logger = new Logger(TicketCSATService.name);

  constructor(
    @InjectRepository(TicketCSAT)
    private readonly csatRepository: Repository<TicketCSAT>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly emailService: TicketEmailService,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new ForbiddenException("Tenant context required");
    return tenantId;
  }

  /**
   * Request CSAT survey for a resolved ticket
   */
  async requestSurvey(ticketId: string): Promise<TicketCSAT> {
    const tenantId = this.getActiveTenantId();
    const { ticket, survey } = await this.ticketRepository.manager.transaction(async manager => {
      const tickets = manager.getRepository(Ticket);
      const surveys = manager.getRepository(TicketCSAT);
      // Lock only the ticket row; locking nullable joins is invalid in PostgreSQL.
      const locked = await tickets.findOne({ where: { id: ticketId, tenantId }, lock: { mode: 'pessimistic_write' } });
      if (!locked) throw new NotFoundException('Ticket not found');
      const ticket = await tickets.findOne({ where: { id: ticketId, tenantId }, relations: ['user', 'assignedTo'] });
      if (!ticket?.user || ticket.user.id !== ticket.userId || ticket.user.tenantId !== tenantId) throw new NotFoundException('Ticket not found');
      if (!['resolved', 'closed'].includes(ticket.status)) throw new BadRequestException('Only resolved tickets can request a survey');
      const existing = await surveys.findOne({ where: { ticketId, tenantId } });
      if (existing) {
        if (existing.surveyCompletedAt) throw new BadRequestException('Survey already completed');
        if (!existing.surveyRequestedAt || existing.surveyRequestedAt.getTime() <= Date.now() - 30 * 86400000) throw new BadRequestException('Survey expired; explicit reissue required');
        return { ticket, survey: existing };
      }
      const survey = await surveys.save(surveys.create({ ticketId, customerId: ticket.userId,
        surveyToken: this.generateSurveyToken(), surveyRequestedAt: new Date(), rating: 0, tenantId }));
      return { ticket, survey };
    });
    // Provider I/O is outside the DB transaction. Failed delivery can resend this same persisted token.
    await this.emailService.sendTicketResolved(ticket, survey.surveyToken);
    this.logger.log(`CSAT survey requested for ticket ${ticketId}`);
    return survey;
  }

  /**
   * Submit CSAT survey response
   */
  async submitSurvey(token: string, surveyData: Partial<CSATSurveyData>) {
    if (
      !Number.isInteger(surveyData.rating) ||
      surveyData.rating < 1 ||
      surveyData.rating > 5
    )
      throw new BadRequestException(
        "Rating must be an integer between 1 and 5",
      );
    if (
      surveyData.feedback != null &&
      (typeof surveyData.feedback !== "string" ||
        surveyData.feedback.length > 4000)
    )
      throw new BadRequestException("Invalid feedback");
    if (
      surveyData.responses != null &&
      (typeof surveyData.responses !== "object" ||
        Array.isArray(surveyData.responses) ||
        Object.values(surveyData.responses).some(
          (value) =>
            value !== null &&
            !["string", "number", "boolean"].includes(typeof value),
        ) ||
        Buffer.byteLength(JSON.stringify(surveyData.responses)) > 8192)
    )
      throw new BadRequestException("Invalid survey responses");
    const csat = await this.findValidSurvey(token);
    if (csat.surveyCompletedAt)
      throw new BadRequestException("Survey already completed");
    const completedAt = new Date();
    const result = await this.csatRepository.update(
      {
        id: csat.id,
        tenantId: csat.tenantId,
        surveyToken: token,
        surveyCompletedAt: IsNull(),
        surveyRequestedAt: MoreThan(new Date(Date.now() - 30 * 86400000)),
      },
      {
        rating: surveyData.rating,
        feedback: surveyData.feedback || "",
        responses: surveyData.responses || {},
        ipAddress: (surveyData.ipAddress || "").slice(0, 100),
        userAgent: (surveyData.userAgent || "").slice(0, 255),
        surveyCompletedAt: completedAt,
      },
    );
    if (result.affected !== 1)
      throw new BadRequestException("Survey already completed or expired");
    return { surveyCompletedAt: completedAt };
  }

  private async findValidSurvey(token: string): Promise<TicketCSAT> {
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new NotFoundException("Survey not found");
    const csat = await this.csatRepository.findOne({
      where: { surveyToken: token },
    });
    if (
      !csat?.tenantId ||
      !csat.surveyRequestedAt ||
      csat.surveyRequestedAt.getTime() <= Date.now() - 30 * 86400000 ||
      csat.surveyRequestedAt.getTime() > Date.now()
    )
      throw new NotFoundException("Survey not found");
    const ticket = await this.ticketRepository.findOne({
      where: { id: csat.ticketId, tenantId: csat.tenantId },
    });
    if (!ticket || ticket.userId !== csat.customerId)
      throw new NotFoundException("Survey not found");
    return { ...csat, ticket };
  }

  async getSurveyByToken(token: string) {
    const csat = await this.findValidSurvey(token);
    return {
      ticketId: csat.ticketId,
      ticket: { subject: csat.ticket.subject },
      surveyCompletedAt: csat.surveyCompletedAt,
    };
  }

  /**
   * Get CSAT statistics for analytics
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date,
    agentId?: string,
  ): Promise<CSATStatistics> {
    const tenantId = this.getActiveTenantId();
    const queryBuilder = this.csatRepository
      .createQueryBuilder("csat")
      .leftJoin("csat.ticket", "ticket")
      .where("ticket.tenantId = :tenantId", { tenantId })
      .andWhere("csat.tenantId = :tenantId", { tenantId });

    if (
      (startDate && !Number.isFinite(startDate.getTime())) ||
      (endDate && !Number.isFinite(endDate.getTime())) ||
      (startDate && endDate && startDate > endDate)
    )
      throw new BadRequestException("Invalid date range");
    // Requested cohort is shared by numerator and denominator.
    if (startDate) {
      queryBuilder.andWhere("csat.surveyRequestedAt >= :startDate", {
        startDate,
      });
    }
    if (endDate) {
      queryBuilder.andWhere("csat.surveyRequestedAt <= :endDate", { endDate });
    }

    // Agent filter
    if (agentId) {
      queryBuilder.andWhere("ticket.assignedToId = :agentId", { agentId });
    }

    const totalRequested = await queryBuilder.clone().getCount();
    const responses = await queryBuilder
      .andWhere("csat.surveyCompletedAt IS NOT NULL")
      .getMany();

    // Calculate statistics
    const totalResponses = responses.length;
    const averageRating =
      totalResponses > 0
        ? responses.reduce((sum, r) => sum + r.rating, 0) / totalResponses
        : 0;

    // Rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: responses.filter((r) => r.rating === rating).length,
    }));

    // Response rate
    const responseRate =
      totalRequested > 0 ? (totalResponses / totalRequested) * 100 : 0;

    // Satisfaction score (% of 4-5 star ratings)
    const satisfiedCount = responses.filter((r) => r.rating >= 4).length;
    const satisfactionScore =
      totalResponses > 0 ? (satisfiedCount / totalResponses) * 100 : 0;

    // Promoter score (5 stars = promoters, 1-3 = detractors)
    const promoters = responses.filter((r) => r.rating === 5).length;
    const detractors = responses.filter((r) => r.rating <= 3).length;
    const promoterScore =
      totalResponses > 0
        ? ((promoters - detractors) / totalResponses) * 100
        : 0;

    return {
      totalResponses,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      responseRate: Math.round(responseRate * 10) / 10,
      satisfactionScore: Math.round(satisfactionScore * 10) / 10,
      promoterScore: Math.round(promoterScore * 10) / 10,
    };
  }

  /**
   * Get recent CSAT feedback
   */
  async getRecentFeedback(limit: number = 10): Promise<TicketCSAT[]> {
    const tenantId = this.getActiveTenantId();
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new BadRequestException("Invalid feedback limit");
    return await this.csatRepository.find({
      where: { tenantId, surveyCompletedAt: Not(IsNull()) },
      order: { surveyCompletedAt: "DESC" },
      take: limit,
      select: {
        id: true,
        ticketId: true,
        rating: true,
        feedback: true,
        surveyCompletedAt: true,
      },
    });
  }

  /**
   * Generate unique survey token
   */
  private generateSurveyToken(): string {
    return randomBytes(32).toString("hex");
  }
}
