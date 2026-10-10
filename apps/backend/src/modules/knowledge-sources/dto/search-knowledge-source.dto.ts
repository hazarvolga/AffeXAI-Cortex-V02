import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchKnowledgeSourceDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  minRelevanceScore?: number = 0.3;

  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
