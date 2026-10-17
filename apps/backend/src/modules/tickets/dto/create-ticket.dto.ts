import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  MinLength,
  IsArray,
  IsObject,
  ArrayMaxSize,
  ArrayUnique,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TicketPriority } from "../enums/ticket-priority.enum";

/**
 * DTO for creating a new support ticket
 */
export class CreateTicketDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  attachmentIds?: string[];

  @ApiProperty({
    description: "Ticket subject/title",
    example: "Lisans anahtarım çalışmıyor",
    minLength: 5,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  subject: string;

  @ApiProperty({
    description: "Detailed description of the issue",
    example:
      'Yeni satın aldığım XYZ Suite 2024 lisans anahtarını girdiğimde "geçersiz anahtar" hatası alıyorum.',
    minLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  description: string;

  @ApiPropertyOptional({
    description: "Category ID for ticket classification",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: "Priority level of the ticket",
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
    default: TicketPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: "Company name of the user",
    example: "Vural Mimarlık",
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: "Additional metadata (e.g., AI analysis results)",
    example: {
      aiSuggestion: "Check graphics card drivers",
      aiPriority: "high",
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Tags for categorizing tickets",
    example: ["license", "installation", "urgent"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Custom fields for additional ticket information",
    example: { softwareVersion: "2024.1", operatingSystem: "Windows 11" },
  })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
