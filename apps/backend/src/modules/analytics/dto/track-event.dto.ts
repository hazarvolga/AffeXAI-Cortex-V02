import { IsString, IsEnum, IsUUID, IsOptional, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InteractionType, DeviceType } from '../entities';

export class CoordinatesDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  relativeX: number;

  @IsNumber()
  relativeY: number;
}

export class ViewportDto {
  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}

export class TrackEventDto {
  @IsString()
  componentId: string;

  @IsString()
  componentType: string;

  @IsEnum(InteractionType)
  interactionType: InteractionType;

  @IsUUID()
  sessionId: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  pageUrl: string;

  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsString()
  @IsOptional()
  browser?: string;

  @ValidateNested()
  @Type(() => ViewportDto)
  viewport: ViewportDto;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsOptional()
  coordinates?: CoordinatesDto;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class BatchTrackEventsDto {
  @ValidateNested({ each: true })
  @Type(() => TrackEventDto)
  events: TrackEventDto[];

  @IsObject()
  @IsOptional()
  session?: {
    id: string;
    startTime: Date;
    deviceType: DeviceType;
    browser?: string;
    os?: string;
  };
}
