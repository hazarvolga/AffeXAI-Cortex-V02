/**
 * Automation Types
 * TypeScript types for marketing automation
 */

// Enums
export enum AutomationStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum TriggerType {
  EVENT = 'event',
  BEHAVIOR = 'behavior',
  TIME_BASED = 'time_based',
  ATTRIBUTE = 'attribute',
}

export enum WorkflowStepType {
  SEND_EMAIL = 'send_email',
  DELAY = 'delay',
  CONDITION = 'condition',
  SPLIT = 'split',
  EXIT = 'exit',
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TriggerEvent {
  SUBSCRIBER_CREATED = 'subscriber.created',
  SUBSCRIBER_UPDATED = 'subscriber.updated',
  SUBSCRIBER_SEGMENT_ADDED = 'subscriber.segment_added',
  SUBSCRIBER_SEGMENT_REMOVED = 'subscriber.segment_removed',
  EMAIL_OPENED = 'email.opened',
  EMAIL_CLICKED = 'email.clicked',
  PURCHASE_MADE = 'purchase.made',
  CART_ABANDONED = 'cart.abandoned',
  PRODUCT_VIEWED = 'product.viewed',
}

// Workflow Step Interface
export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  config: Record<string, any>;
  nextStepId?: string;
  conditionalPaths?: Array<{
    condition: string;
    nextStepId: string;
  }>;
}

// Trigger Configurations
export interface EventTriggerConfig {
  events: TriggerEvent[];
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
}

export interface BehaviorTriggerConfig {
  behaviorType: 'cart_abandonment' | 'inactive_subscriber' | 'browsing_pattern';
  timeWindow: number; // minutes
  conditions?: Record<string, any>;
}

export interface TimeBasedTriggerConfig {
  schedule: 'daily' | 'weekly' | 'monthly' | 'anniversary' | 'birthday';
  time?: string; // HH:mm format
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  dateField: string; // field name in subscriber
  offsetDays?: number; // days before/after the date
}

export interface AttributeTriggerConfig {
  attribute: string;
  oldValue?: any;
  newValue?: any;
  changeType: 'any' | 'specific' | 'increased' | 'decreased';
}

export type TriggerConfig =
  | EventTriggerConfig
  | BehaviorTriggerConfig
  | TimeBasedTriggerConfig
  | AttributeTriggerConfig;

// Automation Trigger Interface (used in wizard)
export interface AutomationTrigger {
  type: TriggerType;
  config: TriggerConfig;
}

// Main Automation Interface
export interface Automation {
  id: string;
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  workflowSteps: WorkflowStep[];
  status: AutomationStatus;
  isActive: boolean;
  segmentId?: string;
  subscriberCount: number;
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Execution Interface
export interface AutomationExecution {
  id: string;
  automationId: string;
  subscriberId: string;
  triggerId?: string;
  status: ExecutionStatus;
  currentStepIndex: number;
  stepResults: StepResult[];
  error?: string;
  startedAt?: string;
  completedAt?: string;
  executionTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StepResult {
  stepId: string;
  stepType: WorkflowStepType;
  status: 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  executionTime: number;
  data?: Record<string, any>;
  error?: string;
}

// Analytics Interface
export interface AutomationAnalytics {
  automationId: string;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  stepPerformance: Array<{
    stepId: string;
    stepType: WorkflowStepType;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    avgExecutionTime: number;
  }>;
  timeline: Array<{
    date: string;
    executions: number;
    completed: number;
    failed: number;
  }>;
  activeSubscribers: number;
}

// Queue Metrics Interface
export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

// DTOs for API
export interface CreateAutomationDto {
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  workflowSteps: WorkflowStep[];
  segmentId?: string;
}

export interface UpdateAutomationDto {
  name?: string;
  description?: string;
  triggerType?: TriggerType;
  triggerConfig?: TriggerConfig;
  workflowSteps?: WorkflowStep[];
  segmentId?: string;
  status?: AutomationStatus;
}

export interface GetExecutionsQuery {
  automationId?: string;
  subscriberId?: string;
  status?: ExecutionStatus;
  page?: number;
  limit?: number;
}

export interface ExecutionsResponse {
  executions: AutomationExecution[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
}
