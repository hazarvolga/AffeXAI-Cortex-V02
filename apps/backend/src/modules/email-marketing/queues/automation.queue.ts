/**
 * Automation Queue Definitions
 * Job types and data interfaces for automation queue
 */

/**
 * Job types for automation queue
 */
export enum AutomationJobType {
  EXECUTE_AUTOMATION = 'execute-automation',
  PROCESS_SCHEDULED_STEP = 'process-scheduled-step',
  RETRY_FAILED_STEP = 'retry-failed-step',
  PROCESS_TRIGGER = 'process-trigger',
}

/**
 * Execute automation job data
 */
export interface ExecuteAutomationJobData {
  automationId: string;
  subscriberId: string;
  tenantId: string;
  triggerId?: string;
  metadata?: Record<string, any>;
}

/**
 * Process scheduled step job data
 */
export interface ProcessScheduledStepJobData {
  scheduleId: string;
  automationId: string;
  subscriberId: string;
  tenantId: string;
  stepIndex: number;
  metadata?: Record<string, any>;
}

/**
 * Retry failed step job data
 */
export interface RetryFailedStepJobData {
  executionId: string;
  stepId: string;
  tenantId: string;
  attemptNumber: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Process trigger job data
 */
export interface ProcessTriggerJobData {
  triggerId: string;
  automationId: string;
  subscriberId: string;
  tenantId: string;
  triggerType: string;
  triggerData?: Record<string, any>;
}

/**
 * Queue name constant
 */
export const AUTOMATION_QUEUE_NAME = 'automation';

/**
 * Job options
 */
export const AUTOMATION_JOB_OPTIONS = {
  // Default retry strategy
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2 seconds initial delay
  },
  // Remove completed jobs after 24 hours
  removeOnComplete: {
    age: 86400, // 24 hours in seconds
    count: 1000, // Keep last 1000 completed jobs
  },
  // Remove failed jobs after 7 days
  removeOnFail: {
    age: 604800, // 7 days in seconds
    count: 5000, // Keep last 5000 failed jobs
  },
};

/**
 * Priority levels
 */
export enum AutomationJobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}
