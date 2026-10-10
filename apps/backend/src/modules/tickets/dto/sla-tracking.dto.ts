import { IsOptional, IsBoolean, IsInt, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for SLA tracking information
 */
export class SLATrackingDto {
  @ApiPropertyOptional({
    description: 'Deadline for first response',
    example: '2024-01-01T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  slaFirstResponseDueAt?: Date;

  @ApiPropertyOptional({
    description: 'Deadline for resolution',
    example: '2024-01-05T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  slaResolutionDueAt?: Date;

  @ApiPropertyOptional({
    description: 'Whether SLA has been breached',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isSLABreached?: boolean;

  @ApiPropertyOptional({
    description: 'Actual response time in hours',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  responseTimeHours?: number;

  @ApiPropertyOptional({
    description: 'Actual resolution time in hours',
    example: 24,
  })
  @IsOptional()
  @IsInt()
  resolutionTimeHours?: number;
}