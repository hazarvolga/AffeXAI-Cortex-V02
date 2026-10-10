import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { BulkImportCertificateDto } from './dto/bulk-import.dto';
import { UsersService } from '../users/users.service';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { StrategyService } from '../strategy/services/strategy.service';
import { CommerceService } from '../commerce/services/commerce.service';


// Type definition for Multer file
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    @InjectRepository(Certificate)
    private certificatesRepository: Repository<Certificate>,
    private usersService: UsersService,
    private readonly strategyService: StrategyService,
    private readonly commerceService: CommerceService,
  ) { }

  async create(
    file: MulterFile,
    createCertificateDto: CreateCertificateDto,
  ): Promise<Certificate> {
    // Dosya URL'sini oluştur (gerçek uygulamada dosya yükleme servisi kullanılmalı)
    const fileUrl = file
      ? `${process.env.MEDIA_BASE_URL || 'http://localhost:9004/media'}/${file.filename}`
      : '';

    const certificate = new Certificate();
    certificate.name = createCertificateDto.name || 'Sertifika Adı Belirtilmemiş';
    certificate.description = createCertificateDto.description || null;
    certificate.issueDate = new Date(createCertificateDto.issueDate || new Date());
    certificate.expiryDate = createCertificateDto.expiryDate ? new Date(createCertificateDto.expiryDate) : null;
    certificate.fileUrl = fileUrl || null;
    certificate.templateId = createCertificateDto.templateId || null;

    // Kullanıcıyı bul
    let tenantId = 'default-tenant'; // Fallback
    if (createCertificateDto.userId) {
      const user = await this.usersService.findOne(createCertificateDto.userId);
      if (user) {
        certificate.userId = createCertificateDto.userId;
        certificate.user = user;
        tenantId = user.tenantId || 'default-tenant';
      }
    }

    // 0. Governance Check (Neural Grid)
    const limitCheck = await this.commerceService.checkLimit(tenantId);
    if (!limitCheck.allowed) {
      this.logger.warn(`Certificate Generation Blocked: Rate limit exceeded for tenant ${tenantId}`);
      throw new Error('Plan Limit Exceeded. Please upgrade to generate more certificates.');
    }

    const savedCertificate = await this.certificatesRepository.save(certificate);

    // 1. Neural Signal (RAG Feed)
    this.strategyService.emitSignal(tenantId, 'CERTIFICATE_GENERATED', {
      certificateId: savedCertificate.id,
      name: savedCertificate.name,
      recipientId: savedCertificate.userId,
      templateId: savedCertificate.templateId
    }).catch(e => this.logger.warn(`Failed to emit signal: ${e.message}`));

    return savedCertificate;
  }

  async findAll(userId?: string): Promise<Certificate[]> {
    if (userId) {
      return this.certificatesRepository.find({
        where: { userId },
        relations: ['user'],
      });
    }
    return this.certificatesRepository.find({ relations: ['user'] });
  }

  async findOne(id: string): Promise<Certificate> {
    const certificate = await this.certificatesRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }
    return certificate;
  }

  async update(
    id: string,
    file: MulterFile,
    updateCertificateDto: UpdateCertificateDto,
  ): Promise<Certificate> {
    const certificate = await this.findOne(id);

    // Dosya varsa URL'yi güncelle
    if (file) {
      certificate.fileUrl = `${process.env.MEDIA_BASE_URL || 'http://localhost:9004/media'}/${file.filename}`;
    }

    // Kullanıcı ID'si varsa kullanıcıyı güncelle
    if (updateCertificateDto.userId) {
      const user = await this.usersService.findOne(updateCertificateDto.userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${updateCertificateDto.userId} not found`);
      }
      certificate.user = user;
      certificate.userId = updateCertificateDto.userId;
    }

    // Update other fields
    if (updateCertificateDto.name) {
      certificate.name = updateCertificateDto.name;
    }
    if (updateCertificateDto.description !== undefined) {
      certificate.description = updateCertificateDto.description || '';
    }
    if (updateCertificateDto.issueDate) {
      certificate.issueDate = new Date(updateCertificateDto.issueDate);
    }
    if (updateCertificateDto.expiryDate !== undefined) {
      certificate.expiryDate = updateCertificateDto.expiryDate ? new Date(updateCertificateDto.expiryDate) : null;
    }
    if (updateCertificateDto.templateId !== undefined) {
      certificate.templateId = updateCertificateDto.templateId || 'default';
    }

    return this.certificatesRepository.save(certificate);
  }

  async remove(id: string): Promise<void> {
    const certificate = await this.findOne(id);
    await this.certificatesRepository.remove(certificate);
  }

  // Toplu içe aktarma metodu
  async bulkImport(certificates: BulkImportCertificateDto[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const certDto of certificates) {
      try {
        // Kullanıcıyı e-posta ile bul
        const user = await this.usersService.findByEmail(certDto.userEmail);
        if (!user) {
          errors.push(`User with email ${certDto.userEmail} not found`);
          failed++;
          continue;
        }

        // Sertifika oluştur
        const certificate = new Certificate();
        certificate.name = certDto.certificateName;
        certificate.description = certDto.description || '';
        certificate.issueDate = new Date(certDto.issueDate);
        certificate.expiryDate = certDto.expiryDate ? new Date(certDto.expiryDate) : null;
        certificate.fileUrl = certDto.filePath || '';
        certificate.userId = user.id;
        certificate.user = user;

        await this.certificatesRepository.save(certificate);
        success++;
      } catch (error) {
        errors.push(`Failed to import certificate for ${certDto.userEmail}: ${error.message}`);
        failed++;
      }
    }

    this.logger.log(`Bulk import completed: ${success} succeeded, ${failed} failed`);
    return { success, failed, errors };
  }

  // PDF Generation method
  async generateCertificatePdf(id: string): Promise<string> {
    try {
      const certificate = await this.findOne(id);

      // Dynamically import PDFKit to avoid issues with types
      const PDFDocument = (await import('pdfkit')).default;

      // Create a document with better styling
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Generate file path
      const fileName = `certificate-${id}.pdf`;
      const filePath = join(process.cwd(), 'uploads', fileName);

      // Create write stream
      const stream = createWriteStream(filePath);
      doc.pipe(stream);

      // Select design based on template ID
      const templateId = certificate.templateId || 'default';

      // Apply design based on template
      switch (templateId) {
        case 'premium':
          this.applyPremiumDesign(doc, certificate);
          break;
        case 'executive':
          this.applyExecutiveDesign(doc, certificate);
          break;
        case 'default':
        default:
          this.applyDefaultDesign(doc, certificate);
          break;
      }

      // Finalize PDF file
      doc.end();

      // Wait for the file to be written
      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          const fileUrl = `${process.env.MEDIA_BASE_URL || 'http://localhost:9004/media'}/${fileName}`;
          resolve(fileUrl);
        });

        stream.on('error', reject);
      });
    } catch (error) {
      // Log the error for debugging
      this.logger.error(`Error generating PDF for certificate ${id}:`, error);
      // Re-throw the error so it can be handled by the controller
      throw error;
    }
  }

  // Default certificate design
  private applyDefaultDesign(doc: any, certificate: any) {
    // Add company header
    doc.fontSize(28).fillColor('#003366').text('ALLPLAN', { align: 'center' });
    doc.fontSize(14).fillColor('#666666').text('BIM Solutions', { align: 'center' });
    doc.moveDown();

    // Add decorative line
    doc.moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .strokeColor('#003366')
      .lineWidth(2)
      .stroke();
    doc.moveDown();

    // Add certificate title
    doc.fontSize(32).fillColor('#000000').text('SERTİFİKA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('CERTIFICATE OF COMPLETION', { align: 'center' });
    doc.moveDown();
    doc.moveDown();

    // Add recipient information
    doc.fontSize(16).fillColor('#000000').text('Bu belge ile', { align: 'center' });
    doc.moveDown();

    // Check if user data is available
    if (certificate.user && certificate.user.firstName && certificate.user.lastName) {
      doc.fontSize(24).text(`${certificate.user.firstName} ${certificate.user.lastName}`, { align: 'center' });
    } else {
      doc.fontSize(24).text('[Alıcı Bilgisi Bulunamadı]', { align: 'center' });
    }
    doc.moveDown();

    doc.fontSize(16).text('isimli kişi', { align: 'center' });
    doc.moveDown();

    // Check if certificate name is available
    if (certificate.name) {
      doc.fontSize(20).text(`${certificate.name}`, { align: 'center' });
    } else {
      doc.fontSize(20).text('[Eğitim Adı Belirtilmemiş]', { align: 'center' });
    }
    doc.moveDown();
    doc.moveDown();

    doc.fontSize(16).text('eğitimini başarıyla tamamlamıştır.', { align: 'center' });
    doc.moveDown();
    doc.moveDown();

    // Add dates
    if (certificate.issueDate) {
      const issueDate = new Date(certificate.issueDate);
      if (!isNaN(issueDate.getTime())) {
        doc.fontSize(14).text(`Veriliş Tarihi: ${issueDate.toLocaleDateString('tr-TR')}`, { align: 'center' });
      } else {
        doc.fontSize(14).text('Veriliş Tarihi: [Tarih Belirtilmemiş]', { align: 'center' });
      }
    } else {
      doc.fontSize(14).text('Veriliş Tarihi: [Tarih Belirtilmemiş]', { align: 'center' });
    }

    if (certificate.expiryDate) {
      const expiryDate = new Date(certificate.expiryDate);
      if (!isNaN(expiryDate.getTime())) {
        doc.text(`Geçerlilik Tarihi: ${expiryDate.toLocaleDateString('tr-TR')}`, { align: 'center' });
      } else {
        doc.text('Geçerlilik Tarihi: [Tarih Belirtilmemiş]', { align: 'center' });
      }
    }

    doc.moveDown();
    doc.moveDown();
    doc.moveDown();

    // Add certificate ID
    doc.fontSize(12).text(`Sertifika No: ${certificate.id}`, { align: 'center' });
    doc.moveDown();

    // Add company contact information
    doc.fontSize(10).text('Allplan Turkey | info@allplan.com.tr | www.allplan.com.tr', { align: 'center' });
  }

  // Premium certificate design
  private applyPremiumDesign(doc: any, certificate: any) {
    // Add decorative border
    doc.rect(40, 40, 515, 750).strokeColor('#003366').lineWidth(2).stroke();
    doc.rect(45, 45, 505, 740).strokeColor('#666666').lineWidth(1).stroke();

    // Add company header with larger font
    doc.fontSize(36).fillColor('#003366').text('ALLPLAN', { align: 'center' });
    doc.fontSize(16).fillColor('#666666').text('BIM Solutions', { align: 'center' });
    doc.moveDown();

    // Add decorative line
    doc.moveTo(100, doc.y)
      .lineTo(500, doc.y)
      .strokeColor('#003366')
      .lineWidth(3)
      .stroke();
    doc.moveDown();
    doc.moveDown();

    // Add certificate title
    doc.fontSize(40).fillColor('#000000').text('SERTİFİKA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text('CERTIFICATE OF COMPLETION', { align: 'center' });
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();

    // Add decorative element
    doc.circle(300, doc.y, 20).strokeColor('#003366').lineWidth(2).stroke();
    doc.moveDown();
    doc.moveDown();

    // Add recipient information
    doc.fontSize(18).fillColor('#000000').text('Bu belge ile', { align: 'center' });
    doc.moveDown();

    // Check if user data is available
    if (certificate.user && certificate.user.firstName && certificate.user.lastName) {
      doc.fontSize(28).text(`${certificate.user.firstName} ${certificate.user.lastName}`, { align: 'center' });
    } else {
      doc.fontSize(28).text('[Alıcı Bilgisi Bulunamadı]', { align: 'center' });
    }
    doc.moveDown();

    doc.fontSize(18).text('isimli kişi', { align: 'center' });
    doc.moveDown();

    // Check if certificate name is available
    if (certificate.name) {
      doc.fontSize(24).text(`${certificate.name}`, { align: 'center' });
    } else {
      doc.fontSize(24).text('[Eğitim Adı Belirtilmemiş]', { align: 'center' });
    }
    doc.moveDown();
    doc.moveDown();

    doc.fontSize(18).text('eğitimini başarıyla tamamlamıştır.', { align: 'center' });
    doc.moveDown();
    doc.moveDown();

    // Add dates
    if (certificate.issueDate) {
      const issueDate = new Date(certificate.issueDate);
      if (!isNaN(issueDate.getTime())) {
        doc.fontSize(16).text(`Veriliş Tarihi: ${issueDate.toLocaleDateString('tr-TR')}`, { align: 'center' });
      } else {
        doc.fontSize(16).text('Veriliş Tarihi: [Tarih Belirtilmemiş]', { align: 'center' });
      }
    } else {
      doc.fontSize(16).text('Veriliş Tarihi: [Tarih Belirtilmemiş]', { align: 'center' });
    }

    if (certificate.expiryDate) {
      const expiryDate = new Date(certificate.expiryDate);
      if (!isNaN(expiryDate.getTime())) {
        doc.fontSize(16).text(`Geçerlilik Tarihi: ${expiryDate.toLocaleDateString('tr-TR')}`, { align: 'center' });
      } else {
        doc.fontSize(16).text('Geçerlilik Tarihi: [Tarih Belirtilmemiş]', { align: 'center' });
      }
    }

    doc.moveDown();
    doc.moveDown();
    doc.moveDown();

    // Add certificate ID
    doc.fontSize(14).text(`Sertifika No: ${certificate.id}`, { align: 'center' });
    doc.moveDown();

    // Add company contact information
    doc.fontSize(12).text('Allplan Turkey | info@allplan.com.tr | www.allplan.com.tr', { align: 'center' });
  }

  // Executive certificate design
  private applyExecutiveDesign(doc: any, certificate: any) {
    // Add background color
    doc.rect(0, 0, 600, 850).fillColor('#f8f9fa').fill();

    // Add company header
    doc.fontSize(40).fillColor('#003366').text('ALLPLAN', { align: 'center' });
    doc.fontSize(18).fillColor('#666666').text('BIM Solutions', { align: 'center' });
    doc.moveDown();

    // Add decorative line
    doc.moveTo(100, doc.y)
      .lineTo(500, doc.y)
      .strokeColor('#003366')
      .lineWidth(4)
      .stroke();
    doc.moveDown();
    doc.moveDown();

    // Add certificate title
    doc.fontSize(48).fillColor('#000000').text('SERTİFİKA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(24).text('CERTIFICATE OF COMPLETION', { align: 'center' });
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();

    // Add decorative seal
    doc.circle(300, doc.y, 40).strokeColor('#003366').lineWidth(3).stroke();
    doc.fontSize(16).fillColor('#003366').text('ONAY', { align: 'center' });
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();

    // Add recipient information
    doc.fontSize(20).fillColor('#000000').text('Bu belge ile', { align: 'center' });
    doc.moveDown();

    // Check if user data is available
    if (certificate.user && certificate.user.firstName && certificate.user.lastName) {
      doc.fontSize(32).text(`${certificate.user.firstName} ${certificate.user.lastName}`, { align: 'center' });
    } else {
      doc.fontSize(32).text('[Alıcı Bilgisi Bulunamadı]', { align: 'center' });
    }
    doc.moveDown();

    doc.fontSize(20).text('isimli kişi', { align: 'center' });
    doc.moveDown();

    // Check if certificate name is available
    if (certificate.name) {
      doc.fontSize(28).text(`${certificate.name}`, { align: 'center' });
    } else {
      doc.fontSize(28).text('[Eğitim Adı Belirtilmemiş]', { align: 'center' });
    }
    doc.moveDown();
    doc.moveDown();

    doc.fontSize(20).text('eğitimini başarıyla tamamlamıştır.', { align: 'center' });
    doc.moveDown();
    doc.moveDown();

    // Add dates
    if (certificate.issueDate) {
      const issueDate = new Date(certificate.issueDate);
      if (!isNaN(issueDate.getTime())) {
        doc.fontSize(18).text(`Veriliş Tarihi: ${issueDate.toLocaleDateString('tr-TR')}`, { align: 'center' });
      } else {
        doc.fontSize(18).text('Veriliş Tarihi: [Tarih Belirtilmemiş]', { align: 'center' });
      }
    } else {
      doc.fontSize(18).text('Veriliş Tarihi: [Tarih Belirtilmemiş]', { align: 'center' });
    }

    if (certificate.expiryDate) {
      const expiryDate = new Date(certificate.expiryDate);
      if (!isNaN(expiryDate.getTime())) {
        doc.fontSize(18).text(`Geçerlilik Tarihi: ${expiryDate.toLocaleDateString('tr-TR')}`, { align: 'center' });
      } else {
        doc.fontSize(18).text('Geçerlilik Tarihi: [Tarih Belirtilmemiş]', { align: 'center' });
      }
    }

    doc.moveDown();
    doc.moveDown();
    doc.moveDown();

    // Add signature line
    doc.moveTo(200, doc.y)
      .lineTo(400, doc.y)
      .strokeColor('#000000')
      .lineWidth(1)
      .stroke();
    doc.fontSize(14).text('Yetkili İmza', { align: 'center' });
    doc.moveDown();
    doc.moveDown();

    // Add certificate ID
    doc.fontSize(14).text(`Sertifika No: ${certificate.id}`, { align: 'center' });
    doc.moveDown();

    // Add company contact information
    doc.fontSize(12).text('Allplan Turkey | info@allplan.com.tr | www.allplan.com.tr', { align: 'center' });
  }
}