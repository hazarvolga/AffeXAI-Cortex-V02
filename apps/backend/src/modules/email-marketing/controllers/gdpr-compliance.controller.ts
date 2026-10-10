import { PlatformAdminGuard } from '../../../core/auth/guards/platform-admin.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import {
  GdprComplianceService,
  ConsentType,
  ConsentMethod,
  LegalBasis,
  DataSubjectRequestType
} from '../services/gdpr-compliance.service';
import { BulkOperationsComplianceService } from '../services/bulk-operations-compliance.service';

export class TrackConsentDto {
  email: string;
  consentType: ConsentType;
  consentMethod: ConsentMethod;
  legalBasis: LegalBasis;
  dataProcessingPurposes: string[];
  retentionPeriod?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class WithdrawConsentDto {
  email: string;
  consentType: ConsentType;
  reason?: string;
}

export class DataSubjectRequestDto {
  email: string;
  requestType: DataSubjectRequestType;
  verificationMethod?: string;
  requestDetails?: Record<string, any>;
}

export class BulkComplianceValidationDto {
  operation: 'import' | 'export';
  subscriberData?: any[];
  exportFilters?: any;
  complianceOptions: any;
}

@ApiTags('GDPR Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@Controller('email-marketing/gdpr')
export class GdprComplianceController {
  private readonly logger = new Logger(GdprComplianceController.name);

  constructor(
    private readonly gdprService: GdprComplianceService,
    private readonly bulkComplianceService: BulkOperationsComplianceService
  ) { }

  @Post('consent/track')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Track consent for GDPR compliance' })
  @ApiResponse({ status: 201, description: 'Consent tracked successfully' })
  async trackConsent(@Body() dto: TrackConsentDto) {
    try {
      const consentRecord = await this.gdprService.trackConsent(
        dto.email,
        dto.consentType,
        dto.consentMethod,
        dto.legalBasis,
        {
          dataProcessingPurposes: dto.dataProcessingPurposes,
          retentionPeriod: dto.retentionPeriod,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          metadata: dto.metadata
        }
      );

      return {
        success: true,
        message: 'Consent tracked successfully',
        data: consentRecord
      };
    } catch (error) {
      this.logger.error('Failed to track consent:', error);
      throw error;
    }
  }

  @Post('consent/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw consent' })
  @ApiResponse({ status: 200, description: 'Consent withdrawn successfully' })
  async withdrawConsent(@Body() dto: WithdrawConsentDto) {
    try {
      await this.gdprService.withdrawConsent(
        dto.email,
        dto.consentType,
        dto.reason
      );

      return {
        success: true,
        message: 'Consent withdrawn successfully'
      };
    } catch (error) {
      this.logger.error('Failed to withdraw consent:', error);
      throw error;
    }
  }

  @Get('consent/check/:email')
  @ApiOperation({ summary: 'Check consent status for subscriber' })
  @ApiResponse({ status: 200, description: 'Consent status retrieved' })
  async checkConsent(
    @Param('email') email: string,
    @Query('consentType') consentType: ConsentType,
    @Query('purpose') purpose?: string
  ) {
    try {
      const hasConsent = await this.gdprService.hasValidConsent(
        email,
        consentType,
        purpose
      );

      return {
        success: true,
        data: {
          email,
          consentType,
          purpose,
          hasValidConsent: hasConsent
        }
      };
    } catch (error) {
      this.logger.error('Failed to check consent:', error);
      throw error;
    }
  }

  @Post('data-subject-request/access')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Handle data subject access request (Article 15)' })
  @ApiResponse({ status: 202, description: 'Access request initiated' })
  async handleAccessRequest(@Body() dto: { email: string }) {
    try {
      const request = await this.gdprService.handleAccessRequest(dto.email);

      return {
        success: true,
        message: 'Access request processed',
        data: {
          requestId: request.id,
          status: request.status,
          responseData: request.responseData
        }
      };
    } catch (error) {
      this.logger.error('Failed to handle access request:', error);
      throw error;
    }
  }

  @Post('data-subject-request/erasure')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Handle right to be forgotten request (Article 17)' })
  @ApiResponse({ status: 202, description: 'Erasure request initiated' })
  async handleErasureRequest(@Body() dto: { email: string; retainStatistics?: boolean }) {
    try {
      const request = await this.gdprService.handleErasureRequest(
        dto.email,
        dto.retainStatistics
      );

      return {
        success: true,
        message: 'Erasure request processed',
        data: {
          requestId: request.id,
          status: request.status
        }
      };
    } catch (error) {
      this.logger.error('Failed to handle erasure request:', error);
      throw error;
    }
  }

  @Post('data-subject-request/portability')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Handle data portability request (Article 20)' })
  @ApiResponse({ status: 202, description: 'Portability request initiated' })
  async handlePortabilityRequest(@Body() dto: { email: string }) {
    try {
      const request = await this.gdprService.handlePortabilityRequest(dto.email);

      return {
        success: true,
        message: 'Data portability request processed',
        data: {
          requestId: request.id,
          status: request.status,
          portableData: request.responseData
        }
      };
    } catch (error) {
      this.logger.error('Failed to handle portability request:', error);
      throw error;
    }
  }

  @Get('compliance-report')
  @ApiOperation({ summary: 'Generate GDPR compliance report' })
  @ApiResponse({ status: 200, description: 'Compliance report generated' })
  async generateComplianceReport() {
    try {
      const report = await this.gdprService.generateComplianceReport();

      return {
        success: true,
        data: report
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  @Post('data-retention/cleanup')
  @UseGuards(PlatformAdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform automated data retention cleanup' })
  @ApiResponse({ status: 200, description: 'Data retention cleanup completed' })
  async performDataRetentionCleanup() {
    try {
      const result = await this.gdprService.performDataRetentionCleanup();

      return {
        success: true,
        message: 'Data retention cleanup completed',
        data: result
      };
    } catch (error) {
      this.logger.error('Failed to perform data retention cleanup:', error);
      throw error;
    }
  }

  @Post('bulk-operations/validate-compliance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate bulk operation for GDPR compliance' })
  @ApiResponse({ status: 200, description: 'Compliance validation completed' })
  async validateBulkOperationCompliance(@Body() dto: BulkComplianceValidationDto) {
    try {
      let validationResult;

      if (dto.operation === 'import') {
        validationResult = await this.bulkComplianceService.validateBulkImportCompliance(
          dto.subscriberData || [],
          dto.complianceOptions
        );
      } else {
        validationResult = await this.bulkComplianceService.validateBulkExportCompliance(
          dto.exportFilters || {},
          dto.complianceOptions
        );
      }

      return {
        success: true,
        data: validationResult
      };
    } catch (error) {
      this.logger.error('Failed to validate bulk operation compliance:', error);
      throw error;
    }
  }

  @Get('anonymization/preview')
  @ApiOperation({ summary: 'Preview data anonymization' })
  @ApiResponse({ status: 200, description: 'Anonymization preview generated' })
  async previewAnonymization(
    @Query('emails') emails: string,
    @Query('method') method: 'hash' | 'pseudonymize' | 'generalize' | 'suppress' = 'hash'
  ) {
    try {
      const emailList = emails.split(',').map(e => e.trim());

      // This is a simplified preview - in reality, you'd fetch actual subscriber data
      const previewData = emailList.map(email => {
        switch (method) {
          case 'hash':
            return { original: email, anonymized: `hash_${email.substring(0, 3)}***` };
          case 'pseudonymize':
            return { original: email, anonymized: `pseudo_${email.substring(0, 3)}***` };
          case 'generalize':
            return { original: email, anonymized: `***@${email.split('@')[1] || '***'}` };
          case 'suppress':
            return { original: email, anonymized: '[REDACTED]' };
          default:
            return { original: email, anonymized: email };
        }
      });

      return {
        success: true,
        data: {
          method,
          preview: previewData
        }
      };
    } catch (error) {
      this.logger.error('Failed to generate anonymization preview:', error);
      throw error;
    }
  }

  @Delete('subscriber/:email/gdpr-erasure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Immediate GDPR erasure (admin only)' })
  @ApiResponse({ status: 200, description: 'Subscriber data erased' })
  async immediateGdprErasure(
    @Param('email') email: string,
    @Query('retainStatistics') retainStatistics: boolean = true
  ) {
    try {
      const request = await this.gdprService.handleErasureRequest(email, retainStatistics);

      return {
        success: true,
        message: 'GDPR erasure completed',
        data: {
          requestId: request.id,
          status: request.status,
          retainedStatistics: retainStatistics
        }
      };
    } catch (error) {
      this.logger.error('Failed to perform immediate GDPR erasure:', error);
      throw error;
    }
  }
}