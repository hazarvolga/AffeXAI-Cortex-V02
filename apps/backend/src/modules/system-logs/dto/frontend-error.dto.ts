import { IsString, IsEnum, IsOptional, IsNumber, IsObject, IsDate } from 'class-validator';

export enum FrontendErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum FrontendErrorCategory {
  API = 'api',
  COMPONENT = 'component',
  RENDER = 'render',
  NETWORK = 'network',
  AUTH = 'auth',
  UNKNOWN = 'unknown',
}

export class FrontendErrorDto {
  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  stack?: string;

  @IsEnum(FrontendErrorSeverity)
  severity: FrontendErrorSeverity;

  @IsEnum(FrontendErrorCategory)
  category: FrontendErrorCategory;

  @IsString()
  url: string;

  @IsString()
  userAgent: string;

  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
