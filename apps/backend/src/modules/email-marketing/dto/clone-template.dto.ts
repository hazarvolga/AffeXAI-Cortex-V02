import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CloneTemplateDto {
  @IsString()
  @IsOptional()
  newName?: string;

  @IsString()
  @IsOptional()
  newDescription?: string;

  @IsBoolean()
  @IsOptional()
  makeEditable?: boolean; // Convert file-based to editable DB template
}
