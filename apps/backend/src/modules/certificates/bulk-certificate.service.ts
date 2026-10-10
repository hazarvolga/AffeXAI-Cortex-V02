import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate, CertificateStatus } from './entities/certificate.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';

interface BulkCertificateData {
  recipientName: string;
  recipientEmail: string;
  userId?: string;
}

interface EventCertificateConfig {
  templateId: string | null;
  logoMediaId: string | null;
  description: string | null;
  validityDays: number | null;
}

@Injectable()
export class BulkCertificateService {
  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
  ) {}

  /**
   * Generate certificates for multiple participants based on event configuration
   */
  async generateForEvent(
    eventId: string,
    eventTitle: string,
    config: EventCertificateConfig,
    participants: BulkCertificateData[],
  ): Promise<Certificate[]> {
    if (!participants || participants.length === 0) {
      throw new BadRequestException('No participants provided');
    }

    if (!config.templateId) {
      throw new BadRequestException('Certificate template is required');
    }

    // Calculate validity date if needed
    const validUntil = config.validityDays
      ? new Date(Date.now() + config.validityDays * 24 * 60 * 60 * 1000)
      : null;

    // Create certificate data for each participant
    const certificatesData: Partial<Certificate>[] = participants.map((participant) => ({
      recipientName: participant.recipientName,
      recipientEmail: participant.recipientEmail,
      trainingTitle: eventTitle,
      description: config.description || `${eventTitle} etkinliğine katılım sertifikasıdır.`,
      templateId: config.templateId,
      logoMediaId: config.logoMediaId,
      userId: participant.userId || null,
      eventId: eventId,
      issuedAt: new Date(),
      validUntil: validUntil,
      status: CertificateStatus.ISSUED,
    }));

    // Bulk insert
    const certificates = this.certificateRepository.create(certificatesData);
    const savedCertificates = await this.certificateRepository.save(certificates);

    return savedCertificates;
  }

  /**
   * Generate certificate for single participant
   */
  async generateSingle(
    eventId: string,
    eventTitle: string,
    config: EventCertificateConfig,
    participant: BulkCertificateData,
  ): Promise<Certificate> {
    const certificates = await this.generateForEvent(
      eventId,
      eventTitle,
      config,
      [participant],
    );

    return certificates[0];
  }

  /**
   * Check if certificate already exists for participant in event
   */
  async certificateExists(eventId: string, recipientEmail: string): Promise<boolean> {
    const count = await this.certificateRepository.count({
      where: {
        eventId,
        recipientEmail,
      },
    });

    return count > 0;
  }

  /**
   * Get all certificates for an event
   */
  async getCertificatesForEvent(eventId: string): Promise<Certificate[]> {
    return this.certificateRepository.find({
      where: { eventId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get certificate statistics for event
   */
  async getEventCertificateStats(eventId: string): Promise<{
    total: number;
    issued: number;
    sent: number;
    draft: number;
  }> {
    const certificates = await this.getCertificatesForEvent(eventId);

    return {
      total: certificates.length,
      issued: certificates.filter(c => c.status === CertificateStatus.ISSUED).length,
      sent: certificates.filter(c => c.status === CertificateStatus.SENT).length,
      draft: certificates.filter(c => c.status === CertificateStatus.DRAFT).length,
    };
  }
}
