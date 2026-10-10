import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsArray, IsUUID, IsNumber, IsDateString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TriggerType, AutomationStatus, WorkflowStep } from '../entities/email-automation.entity';

/**
 * Create Automation DTO
 */
export class CreateAutomationDto {
  @ApiProperty({ description: 'Automation name', example: 'Welcome Series' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Automation description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Trigger type',
    enum: TriggerType,
    example: TriggerType.EVENT 
  })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiProperty({ 
    description: 'Trigger configuration (JSON)',
    example: { events: ['subscriber.created'] }
  })
  @IsObject()
  triggerConfig: Record<string, any>;

  @ApiProperty({ 
    description: 'Workflow steps',
    type: 'array',
    example: [
      {
        id: 'step1',
        type: 'send_email',
        config: { templateId: '123', subject: 'Welcome!' },
        nextStepId: 'step2'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  workflowSteps: WorkflowStepDto[];

  @ApiPropertyOptional({ description: 'Target segment ID (UUID)' })
  @IsUUID()
  @IsOptional()
  segmentId?: string;
}

/**
 * Update Automation DTO
 */
export class UpdateAutomationDto {
  @ApiPropertyOptional({ description: 'Automation name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Automation description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Automation status',
    enum: AutomationStatus 
  })
  @IsEnum(AutomationStatus)
  @IsOptional()
  status?: AutomationStatus;

  @ApiPropertyOptional({ description: 'Trigger configuration (JSON)' })
  @IsObject()
  @IsOptional()
  triggerConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Workflow steps' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  @IsOptional()
  workflowSteps?: WorkflowStepDto[];

  @ApiPropertyOptional({ description: 'Target segment ID (UUID)' })
  @IsUUID()
  @IsOptional()
  segmentId?: string;

  @ApiPropertyOptional({ description: 'Is active flag' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Workflow Step DTO
 */
export class WorkflowStepDto implements WorkflowStep {
  @ApiProperty({ description: 'Step ID (unique within workflow)', example: 'step1' })
  @IsString()
  id: string;

  @ApiProperty({ 
    description: 'Step type',
    enum: ['send_email', 'delay', 'condition', 'split', 'exit'],
    example: 'send_email'
  })
  @IsEnum(['send_email', 'delay', 'condition', 'split', 'exit'])
  type: 'send_email' | 'delay' | 'condition' | 'split' | 'exit';

  @ApiProperty({ 
    description: 'Step configuration (JSON)',
    example: { templateId: '123', subject: 'Welcome!' }
  })
  @IsObject()
  config: Record<string, any>;

  @ApiPropertyOptional({ description: 'Next step ID' })
  @IsString()
  @IsOptional()
  nextStepId?: string;

  @ApiPropertyOptional({ 
    description: 'Conditional paths (for condition/split steps)',
    type: 'array'
  })
  @IsArray()
  @IsOptional()
  conditionalPaths?: {
    condition: string;
    nextStepId: string;
  }[];
}

/**
 * Activate Automation DTO
 */
export class ActivateAutomationDto {
  @ApiProperty({ description: 'Automation ID (UUID)' })
  @IsUUID()
  automationId: string;

  @ApiPropertyOptional({ 
    description: 'Register existing subscribers',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  registerExistingSubscribers?: boolean;
}

/**
 * Pause Automation DTO
 */
export class PauseAutomationDto {
  @ApiProperty({ description: 'Automation ID (UUID)' })
  @IsUUID()
  automationId: string;

  @ApiPropertyOptional({ 
    description: 'Cancel pending executions',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  cancelPendingExecutions?: boolean;
}

/**
 * Test Automation DTO
 */
export class TestAutomationDto {
  @ApiProperty({ description: 'Automation ID (UUID)' })
  @IsUUID()
  automationId: string;

  @ApiProperty({ description: 'Test subscriber ID (UUID)' })
  @IsUUID()
  subscriberId: string;

  @ApiPropertyOptional({ description: 'Test mode (dry run)', default: true })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}

/**
 * Get Executions Query DTO
 */
export class GetExecutionsQueryDto {
  @ApiPropertyOptional({ description: 'Automation ID filter' })
  @IsUUID()
  @IsOptional()
  automationId?: string;

  @ApiPropertyOptional({ description: 'Subscriber ID filter' })
  @IsUUID()
  @IsOptional()
  subscriberId?: string;

  @ApiPropertyOptional({ 
    description: 'Status filter',
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled']
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

/**
 * Automation Analytics DTO
 */
export class AutomationAnalyticsDto {
  @ApiProperty({ description: 'Automation ID (UUID)' })
  @IsUUID()
  automationId: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

/**
 * Automation Response DTO
 */
export class AutomationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty({ enum: AutomationStatus })
  status: AutomationStatus;

  @ApiProperty({ enum: TriggerType })
  triggerType: TriggerType;

  @ApiProperty()
  triggerConfig: Record<string, any>;

  @ApiProperty()
  workflowSteps: WorkflowStep[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  segmentId?: string;

  @ApiProperty()
  subscriberCount: number;

  @ApiProperty()
  executionCount: number;

  @ApiProperty()
  successRate: number;

  @ApiProperty()
  avgExecutionTime: number;

  @ApiProperty()
  lastExecutedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Execution Response DTO
 */
export class ExecutionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  automationId: string;

  @ApiProperty()
  subscriberId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  currentStepIndex: number;

  @ApiProperty()
  stepResults: any[];

  @ApiProperty()
  error?: string;

  @ApiProperty()
  startedAt?: Date;

  @ApiProperty()
  completedAt?: Date;

  @ApiProperty()
  executionTime?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Analytics Response DTO
 */
export class AnalyticsResponseDto {
  @ApiProperty()
  automationId: string;

  @ApiProperty()
  automationName: string;

  @ApiProperty()
  totalExecutions: number;

  @ApiProperty()
  completedExecutions: number;

  @ApiProperty()
  failedExecutions: number;

  @ApiProperty()
  successRate: number;

  @ApiProperty()
  avgExecutionTime: number;

  @ApiProperty()
  totalSubscribers: number;

  @ApiProperty()
  activeSubscribers: number;

  @ApiProperty()
  stepPerformance: {
    stepId: string;
    stepType: string;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    avgExecutionTime: number;
  }[];

  @ApiProperty()
  timeline: {
    date: string;
    executions: number;
    completed: number;
    failed: number;
  }[];
}
