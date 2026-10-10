import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate, CertificateStatus } from './entities/certificate.entity';
import { CertificateTemplate } from './entities/certificate-template.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CreateCertificateTemplateDto } from './dto/create-template.dto';
import { UpdateCertificateTemplateDto } from './dto/update-template.dto';
import { PdfGeneratorService } from './pdf-generator.service';
import { CertificateEmailService } from './certificate-email.service';
import { UsersService } from '../users/users.service';
import { MediaService } from '../media/media.service';
import { getEmailLogoUrl, getCompanyName, getContactInfo } from '../../lib/server/siteSettings';
import { EventBusService } from '../platform-integration/services/event-bus.service';

@Injectable()
export class CertificatesServiceV2 {
  private readonly logger = new Logger(CertificatesServiceV2.name);

  constructor(
    @InjectRepository(Certificate)
    private certificatesRepository: Repository<Certificate>,
    @InjectRepository(CertificateTemplate)
    private templatesRepository: Repository<CertificateTemplate>,
    private pdfGeneratorService: PdfGeneratorService,
    private emailService: CertificateEmailService,
    private usersService: UsersService,
    private mediaService: MediaService,
    private eventBusService: EventBusService,
  ) { }

  // ============ CERTIFICATE OPERATIONS ============

  async createCertificate(dto: CreateCertificateDto, tenantId: string): Promise<Certificate> {
    try {
      const certificate = new Certificate();
      certificate.tenantId = tenantId;

      // New fields
      certificate.recipientName = dto.recipientName;
      certificate.recipientEmail = dto.recipientEmail;
      certificate.trainingTitle = dto.trainingTitle;
      certificate.description = dto.description || null;
      certificate.templateId = dto.templateId || null;
      certificate.logoUrl = dto.logoUrl || null;
      certificate.logoMediaId = dto.logoMediaId || null;
      certificate.signatureUrl = dto.signatureUrl || null;
      certificate.issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : new Date();
      certificate.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
      certificate.status = dto.status || CertificateStatus.DRAFT;

      // Relations
      if (dto.userId) {
        const user = await this.usersService.findOne(dto.userId);
        if (user) {
          certificate.userId = dto.userId;
          certificate.user = user;
        }
      }

      certificate.eventId = dto.eventId || null;

      // Backward compatibility
      certificate.name = dto.name || dto.trainingTitle;
      certificate.issueDate = dto.issueDate ? new Date(dto.issueDate) : certificate.issuedAt;
      certificate.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : certificate.validUntil;

      const saved = await this.certificatesRepository.save(certificate);
      this.logger.log(`Certificate created: ${saved.id}`);

      // Publish platform event when certificate is issued (status = issued)
      if (saved.status === CertificateStatus.ISSUED) {
        await this.eventBusService.publishCertificateIssued(
          saved.id,
          saved.userId || 'unknown',
          saved.eventId || undefined,
        );
      }

      return saved;
    } catch (error) {
      this.logger.error('Failed to create certificate', error);
      throw error;
    }
  }

  async findAllCertificates(tenantId: string, userId?: string): Promise<Certificate[]> {
    const query = this.certificatesRepository.createQueryBuilder('certificate')
      .leftJoinAndSelect('certificate.user', 'user')
      .where('certificate.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.where('certificate.userId = :userId', { userId });
    }

    return query.getMany();
  }

  async findOneCertificate(id: string, tenantId: string): Promise<Certificate> {
    const certificate = await this.certificatesRepository.findOne({
      where: { id, tenantId } as any,
      relations: ['user'],
    });

    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }

    return certificate;
  }

  async updateCertificate(id: string, tenantId: string, dto: UpdateCertificateDto): Promise<Certificate> {
    const certificate = await this.findOneCertificate(id, tenantId);

    // Update fields if provided
    if (dto.recipientName) certificate.recipientName = dto.recipientName;
    if (dto.recipientEmail) certificate.recipientEmail = dto.recipientEmail;
    if (dto.trainingTitle) certificate.trainingTitle = dto.trainingTitle;
    if (dto.description !== undefined) certificate.description = dto.description;
    if (dto.templateId) certificate.templateId = dto.templateId;
    if (dto.logoUrl !== undefined) certificate.logoUrl = dto.logoUrl;
    if (dto.logoMediaId !== undefined) certificate.logoMediaId = dto.logoMediaId;
    if (dto.signatureUrl !== undefined) certificate.signatureUrl = dto.signatureUrl;
    if (dto.issuedAt) certificate.issuedAt = new Date(dto.issuedAt);
    if (dto.validUntil !== undefined) {
      certificate.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    }
    if (dto.status) certificate.status = dto.status;

    // Update relations
    if (dto.userId) {
      const user = await this.usersService.findOne(dto.userId);
      if (user) {
        certificate.userId = dto.userId;
        certificate.user = user;
      }
    }

    // Backward compatibility
    if (dto.name) certificate.name = dto.name;
    if (dto.issueDate) certificate.issueDate = new Date(dto.issueDate);
    if (dto.expiryDate !== undefined) {
      certificate.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    }

    return this.certificatesRepository.save(certificate);
  }

  async deleteCertificate(id: string, tenantId: string): Promise<void> {
    const certificate = await this.findOneCertificate(id, tenantId);

    // Delete PDF file if exists
    if (certificate.pdfUrl) {
      await this.pdfGeneratorService.deletePdf(certificate.pdfUrl, tenantId);
    }

    await this.certificatesRepository.remove(certificate);
    this.logger.log(`Certificate deleted: ${id}`);
  }

  // ============ PDF GENERATION ============

  async generatePdf(certificateId: string, tenantId: string, regenerate = false): Promise<string> {
    const certificate = await this.findOneCertificate(certificateId, tenantId);

    // Check if PDF already exists
    if (certificate.pdfUrl && !regenerate) {
      const exists = await this.pdfGeneratorService.pdfExists(certificate.pdfUrl);
      if (exists) {
        this.logger.log(`PDF already exists: ${certificate.pdfUrl}`);
        return certificate.pdfUrl;
      }
    }

    // Get template
    const template = await this.getTemplate(certificate.templateId || 'default');

    // Resolve logo URL from logoMediaId if present (custom logo)
    let customLogoUrl = certificate.logoUrl;
    if (certificate.logoMediaId && !customLogoUrl) {
      try {
        const media = await this.mediaService.findOne(certificate.logoMediaId);
        if (media) {
          customLogoUrl = `${process.env.API_URL || 'http://localhost:9005'}${media.url}`;
        }
      } catch (error) {
        this.logger.warn(`Failed to resolve logo from mediaId ${certificate.logoMediaId}: ${error.message}`);
      }
    }

    // Get site settings data
    const companyName = getCompanyName();
    const contactInfo = getContactInfo();
    const companyLogoUrl = await getEmailLogoUrl(false); // Light version for certificate

    // Prepare certificate data
    const certificateData = {
      recipientName: certificate.recipientName,
      recipientEmail: certificate.recipientEmail,
      trainingTitle: certificate.trainingTitle,
      description: certificate.description,
      issuedAt: certificate.issuedAt.toISOString(),
      validUntil: certificate.validUntil?.toISOString(),
      logoUrl: customLogoUrl, // Keep backward compatibility
      customLogoUrl: customLogoUrl, // New: user uploaded logo
      signatureUrl: certificate.signatureUrl,
      certificateNumber: certificate.certificateNumber,
      eventId: certificate.eventId,
      // New template variables
      companyName,
      companyAddress: contactInfo?.address || '',
      companyLogoUrl, // Light version for white background
    };

    // Generate PDF
    const pdfUrl = await this.pdfGeneratorService.generateCertificatePdf(
      template,
      certificateData,
      certificate.id,
      tenantId,
    );

    // Update certificate with PDF URL
    certificate.pdfUrl = pdfUrl;
    certificate.fileUrl = pdfUrl; // Backward compatibility
    certificate.status = CertificateStatus.ISSUED;
    await this.certificatesRepository.save(certificate);

    this.logger.log(`PDF generated for certificate: ${certificate.id}`);
    return pdfUrl;
  }

  // ============ EMAIL SENDING ============

  async sendEmail(certificateId: string, tenantId: string): Promise<void> {
    const certificate = await this.findOneCertificate(certificateId, tenantId);

    // Ensure PDF is generated
    if (!certificate.pdfUrl) {
      throw new BadRequestException('Certificate PDF must be generated before sending email');
    }

    await this.emailService.sendCertificateEmail(certificate);

    // Update status
    certificate.status = CertificateStatus.SENT;
    certificate.sentAt = new Date();
    await this.certificatesRepository.save(certificate);

    this.logger.log(`Email sent for certificate: ${certificate.id}`);
  }

  // ============ TEMPLATE OPERATIONS ============

  async createTemplate(dto: CreateCertificateTemplateDto): Promise<CertificateTemplate> {
    const template = this.templatesRepository.create(dto);
    return this.templatesRepository.save(template);
  }

  async findAllTemplates(): Promise<CertificateTemplate[]> {
    return this.templatesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOneTemplate(id: string): Promise<CertificateTemplate> {
    const template = await this.templatesRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async updateTemplate(id: string, dto: UpdateCertificateTemplateDto): Promise<CertificateTemplate> {
    const template = await this.findOneTemplate(id);
    Object.assign(template, dto);
    return this.templatesRepository.save(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.findOneTemplate(id);
    await this.templatesRepository.remove(template);
  }

  // ============ HELPER METHODS ============

  private async getTemplate(templateId: string): Promise<CertificateTemplate> {
    try {
      return await this.findOneTemplate(templateId);
    } catch {
      // If template not found, return default template
      this.logger.warn(`Template ${templateId} not found, using default`);
      const defaultTemplate = await this.templatesRepository.findOne({
        where: { name: 'Default' },
      });

      if (!defaultTemplate) {
        throw new NotFoundException('Default template not found. Please seed templates.');
      }

      return defaultTemplate;
    }
  }

  async generateAndSendCertificate(
    certificateId: string,
    tenantId: string, // Change: Accept tenantId from controller
    options: { sendEmail?: boolean; regenerate?: boolean } = {},
  ): Promise<{ pdfUrl: string; emailSent: boolean }> {
    // Generate PDF
    const pdfUrl = await this.generatePdf(certificateId, tenantId, options.regenerate);

    // Send email if requested
    let emailSent = false;
    if (options.sendEmail) {
      await this.sendEmail(certificateId, tenantId);
      emailSent = true;
    }

    return { pdfUrl, emailSent };
  }

  // ============ STATISTICS ============

  async getStatistics(userId?: string): Promise<any> {
    const query = this.certificatesRepository.createQueryBuilder('certificate');

    if (userId) {
      query.where('certificate.userId = :userId', { userId });
    }

    const total = await query.getCount();

    const draft = await query.clone()
      .andWhere('certificate.status = :status', { status: CertificateStatus.DRAFT })
      .getCount();

    const issued = await query.clone()
      .andWhere('certificate.status = :status', { status: CertificateStatus.ISSUED })
      .getCount();

    const sent = await query.clone()
      .andWhere('certificate.status = :status', { status: CertificateStatus.SENT })
      .getCount();

    const revoked = await query.clone()
      .andWhere('certificate.status = :status', { status: CertificateStatus.REVOKED })
      .getCount();

    return {
      total,
      draft,
      issued,
      sent,
      revoked,
    };
  }
}
