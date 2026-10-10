import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  Min,
  Max,
} from "class-validator";
import { SignalType, SignalSource } from "../interfaces/signal.interface";

export class CreateSignalDto {
  @IsEnum(SignalType)
  type: SignalType;

  @IsEnum(SignalSource)
  source: SignalSource;

  @IsNumber()
  @Min(0)
  @Max(1)
  intensity: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
