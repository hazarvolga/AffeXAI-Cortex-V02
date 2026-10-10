import { httpClient } from './http-client';

export interface ApprovalRequest {
  id: string;
  ruleId: string;
  eventId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'critical';
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  pendingActions: Array<{
    type: string;
    config: Record<string, any>;
    estimatedImpact?: {
      affectedUsers?: number;
      affectedRecords?: number;
      externalCalls?: number;
    };
  }>;
  requestedBy: string;
  requestReason?: string;
  requestContext?: Record<string, any>;
  approvedBy?: string;
  approvedAt?: string;
  approvalComment?: string;
  approvalChain?: Array<{
    userId: string;
    userName: string;
    action: 'approved' | 'rejected';
    comment?: string;
    timestamp: string;
    ipAddress?: string;
  }>;
  requiredApprovals: number;
  currentApprovals: number;
  expiresAt: string;
  isExpired: boolean;
  isExecuted: boolean;
  executedAt?: string;
  executionResult?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStats {
  pending: number;
  urgent: number;
  approved: number;
  rejected: number;
  expired: number;
  executed: number;
}

export const approvalsService = {
  /**
   * Get all approval requests
   */
  async getAll(): Promise<ApprovalRequest[]> {
    return httpClient.get<ApprovalRequest[]>('/automation/approvals');
  },

  /**
   * Get pending approval requests
   */
  async getPending(): Promise<ApprovalRequest[]> {
    return httpClient.get<ApprovalRequest[]>('/automation/approvals/pending');
  },

  /**
   * Get a single approval request
   */
  async getOne(id: string): Promise<ApprovalRequest> {
    return httpClient.get<ApprovalRequest>(`/automation/approvals/${id}`);
  },

  /**
   * Approve an approval request
   */
  async approve(
    id: string,
    userId: string,
    userName: string,
    comment?: string
  ): Promise<ApprovalRequest> {
    return httpClient.post<ApprovalRequest>(`/automation/approvals/${id}/approve`, {
      userId,
      userName,
      comment,
    });
  },

  /**
   * Reject an approval request
   */
  async reject(
    id: string,
    userId: string,
    userName: string,
    comment?: string
  ): Promise<ApprovalRequest> {
    return httpClient.post<ApprovalRequest>(`/automation/approvals/${id}/reject`, {
      userId,
      userName,
      comment,
    });
  },

  /**
   * Get approval statistics
   */
  async getStats(): Promise<ApprovalStats> {
    return httpClient.get<ApprovalStats>('/automation/approvals/stats/overview');
  },
};
