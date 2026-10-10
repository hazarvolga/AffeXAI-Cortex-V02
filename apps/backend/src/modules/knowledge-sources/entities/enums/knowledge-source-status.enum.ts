export enum KnowledgeSourceStatus {
  PENDING = 'pending',         // Awaiting processing
  PROCESSING = 'processing',   // Currently being processed
  ACTIVE = 'active',           // Ready to use
  FAILED = 'failed',           // Processing failed
  ARCHIVED = 'archived',       // Archived (soft delete)
}
