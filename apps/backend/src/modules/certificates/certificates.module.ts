import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { CertificatesServiceV2 } from './certificates-v2.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { CertificateEmailService } from './certificate-email.service';
import { BulkCertificateService } from './bulk-certificate.service';
import { CertificatesController } from './certificates.controller';
import { Certificate } from './entities/certificate.entity';
import { CertificateTemplate } from './entities/certificate-template.entity';
import { UsersModule } from '../users/users.module';
import { MediaModule } from '../media/media.module';
import { PlatformIntegrationModule } from '../platform-integration/platform-integration.module';
import { StrategyModule } from '../strategy/strategy.module';
import { CommerceModule } from '../commerce/commerce.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate, CertificateTemplate]),
    UsersModule,
    MediaModule,
    MediaModule,
    PlatformIntegrationModule,
    StrategyModule,
    CommerceModule,

  ],
  controllers: [CertificatesController],
  providers: [
    CertificatesService, // Keep old service for backward compatibility
    CertificatesServiceV2, // New enhanced service
    BulkCertificateService, // Bulk operations for events
    PdfGeneratorService,
    CertificateEmailService,
  ],
  exports: [CertificatesService, CertificatesServiceV2, BulkCertificateService],
})
export class CertificatesModule { }