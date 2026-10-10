import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { BulkCertificateService } from '../certificates/bulk-certificate.service';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly bulkCertificateService: BulkCertificateService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get event dashboard statistics' })
  getStats() {
    return this.eventsService.getDashboardStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details by ID or slug' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete event' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Post(':id/register')
  @ApiOperation({ summary: 'Register for an event' })
  register(@Param('id') id: string, @Body() body: { name: string; email: string }) {
    return this.eventsService.register(id, body);
  }

  /**
   * Generate certificates for event participants
   */
  @Post(':id/certificates/generate')
  @ApiOperation({ summary: 'Generate certificates for participants' })
  async generateCertificates(
    @Param('id') eventId: string,
    @Body() body: { participantIds?: string[]; userIds?: string[] },
  ) {
    const event = await this.eventsService.findOne(eventId);
    // No null check needed - findOne throws NotFoundException if not found

    if (!event.certificateConfig?.enabled) {
      throw new BadRequestException('Certificates are not enabled for this event');
    }

    // Get participants from registration if no specific IDs provided
    let participants: Array<{ recipientName: string; recipientEmail: string; userId?: string }> = [];
    if (body.participantIds && body.participantIds.length > 0) {
      const registrations = await this.eventsService.getRegistrations(eventId);
      participants = registrations
        .filter(r => body.participantIds.includes(r.id))
        .map(r => ({
          recipientName: r.guestName,
          recipientEmail: r.guestEmail,
          userId: r.user?.id || r.id,
        }));
    } else {
      const registrations = await this.eventsService.getRegistrations(eventId);
      participants = registrations
        .filter(r => r.status === 'confirmed')
        .map(r => ({
          recipientName: r.guestName,
          recipientEmail: r.guestEmail,
          userId: r.user?.id || r.id,
        }));

      if (participants.length === 0) {
        return { message: 'Zero eligible units found for award generation', count: 0, certificates: [] };
      }
    }

    const certificates = await this.bulkCertificateService.generateForEvent(
      eventId,
      event.title,
      {
        templateId: event.certificateConfig.templateId,
        logoMediaId: event.certificateConfig.logoMediaId,
        description: event.certificateConfig.description,
        validityDays: event.certificateConfig.validityDays,
      },
      participants,
    );

    return {
      message: `${certificates.length} certificates generated successfully`,
      count: certificates.length,
      certificates,
    };
  }

  /**
   * Get certificate statistics for event
   */
  @Get(':id/certificates/stats')
  @ApiOperation({ summary: 'Get certificate statistics for an event' })
  async getCertificateStats(@Param('id') eventId: string) {
    return this.bulkCertificateService.getEventCertificateStats(eventId);
  }

  /**
   * Get all certificates for event
   */
  @Get(':id/certificates')
  @ApiOperation({ summary: 'Get all certificates for an event' })
  async getEventCertificates(@Param('id') eventId: string) {
    return this.bulkCertificateService.getCertificatesForEvent(eventId);
  }

  /**
   * Send event invitation email to participant
   */
  @Post(':id/emails/invitation')
  @ApiOperation({ summary: 'Send event invitation email' })
  async sendInvitation(
    @Param('id') eventId: string,
    @Body() body: { email: string; name: string; additionalInfo?: Record<string, any> },
  ) {
    const event = await this.eventsService.findOne(eventId);
    await this.eventsService.sendEventInvitation(event, body.email, body.name, body.additionalInfo);
    return { message: 'Invitation email sent successfully' };
  }

  /**
   * Send event reminder email to participant
   */
  @Post(':id/emails/reminder')
  @ApiOperation({ summary: 'Send event reminder email' })
  async sendReminder(
    @Param('id') eventId: string,
    @Body() body: { email: string; name: string },
  ) {
    const event = await this.eventsService.findOne(eventId);
    await this.eventsService.sendEventReminder(event, body.email, body.name);
    return { message: 'Reminder email sent successfully' };
  }

  /**
   * Send event cancellation email to participant
   */
  @Post(':id/emails/cancellation')
  @ApiOperation({ summary: 'Send event cancellation email' })
  async sendCancellation(
    @Param('id') eventId: string,
    @Body() body: { email: string; name: string; reason?: string },
  ) {
    const event = await this.eventsService.findOne(eventId);
    await this.eventsService.sendEventCancellation(event, body.email, body.name, body.reason);
    return { message: 'Cancellation email sent successfully' };
  }

  /**
   * Send event update notification to participant
   */
  @Post(':id/emails/update')
  @ApiOperation({ summary: 'Send event update email' })
  async sendUpdate(
    @Param('id') eventId: string,
    @Body() body: { email: string; name: string; changes: string[] },
  ) {
    const event = await this.eventsService.findOne(eventId);
    await this.eventsService.sendEventUpdate(event, body.email, body.name, body.changes);
    return { message: 'Update email sent successfully' };
  }

  /**
   * Send bulk reminders to all confirmed participants
   */
  @Post(':id/emails/reminder/bulk')
  @ApiOperation({ summary: 'Send bulk reminder emails' })
  async sendBulkReminder(@Param('id') eventId: string) {
    return this.eventsService.sendBulkReminder(eventId);
  }

  /**
   * Get all registrations for an event
   */
  @Get(':id/registrations')
  @ApiOperation({ summary: 'Get all registrations for an event' })
  async getRegistrations(@Param('id') eventId: string) {
    return this.eventsService.getRegistrations(eventId);
  }

  /**
   * Update registration status
   */
  @Patch('registrations/:registrationId/status')
  @ApiOperation({ summary: 'Update registration status' })
  async updateRegistrationStatus(
    @Param('registrationId') registrationId: string,
    @Body() body: { status: string },
  ) {
    return this.eventsService.updateRegistrationStatus(registrationId, body.status);
  }
}