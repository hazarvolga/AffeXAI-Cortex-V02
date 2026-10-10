import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';

export enum AuditAction {
  FAQ_CREATED = 'faq_created',
  FAQ_UPDATED = 'faq_updated',
  FAQ_DELETED = 'faq_deleted',
  FAQ_APPROVED = 'faq_approved',
  FAQ_REJECTED = 'faq_rejected',
  FAQ_PUBLISHED = 'faq_published',
  CONFIG_UPDATED = 'config_updated',
  PROVIDER_SWITCHED = 'provider_switched',
  BATCH_PROCESSED = 'batch_processed',
  PATTERN_CREATED = 'pattern_created',
  USER_ACCESS = 'user_access',
  SECURITY_EVENT = 'security_event',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  severity: AuditSeverity;
  userId?: string;
  userName?: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export interface AccessControlCheck {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
  userRole?: string;
}

@Injectable()
export class AuditLoggingService {
  private readonly logger = new Logger(AuditLoggingService.name);
  private auditLogs: AuditLog[] = [];
  private readonly MAX_LOGS = 10000;

  constructor(
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
  ) {}

  async logAction(data: {
    action: AuditAction;
    severity?: AuditSeverity;
    userId?: string;
    userName?: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<AuditLog> {
    
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: data.action,
      severity: data.severity || AuditSeverity.INFO,
      userId: data.userId,
      userName: data.userName,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      details: data.details || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date(),
      success: data.success !== false,
      errorMessage: data.errorMessage,
    };

    this.auditLogs.unshift(log);

    if (this.auditLogs.length > this.MAX_LOGS) {
      this.auditLogs = this.auditLogs.slice(0, this.MAX_LOGS);
    }

    const logMessage = `[${log.severity.toUpperCase()}] ${log.action} by ${log.userName || log.userId || 'system'} on ${log.resourceType}${log.resourceId ? `:${log.resourceId}` : ''}`;
    
    if (log.severity === AuditSeverity.CRITICAL || log.severity === AuditSeverity.ERROR) {
      this.logger.error(logMessage, log.details);
    } else if (log.severity === AuditSeverity.WARNING) {
      this.logger.warn(logMessage, log.details);
    } else {
      this.logger.log(logMessage);
    }

    return log;
  }

  async checkAccess(data: {
    userId: string;
    userRole: string;
    action: string;
    resourceType: string;
    resourceId?: string;
  }): Promise<AccessControlCheck> {
    
    const rolePermissions = await this.getRolePermissions();
    const requiredRole = this.getRequiredRole(data.action, data.resourceType);

    const allowed = this.hasPermission(data.userRole, requiredRole, rolePermissions);

    await this.logAction({
      action: AuditAction.USER_ACCESS,
      severity: allowed ? AuditSeverity.INFO : AuditSeverity.WARNING,
      userId: data.userId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      details: {
        action: data.action,
        userRole: data.userRole,
        requiredRole,
        allowed,
      },
      success: allowed,
      errorMessage: allowed ? undefined : 'Access denied',
    });

    return {
      allowed,
      reason: allowed ? undefined : 'Insufficient permissions',
      requiredRole,
      userRole: data.userRole,
    };
  }

  async logSecurityEvent(data: {
    eventType: string;
    severity: AuditSeverity;
    userId?: string;
    details: Record<string, any>;
    ipAddress?: string;
  }): Promise<void> {
    
    await this.logAction({
      action: AuditAction.SECURITY_EVENT,
      severity: data.severity,
      userId: data.userId,
      resourceType: 'security',
      details: {
        eventType: data.eventType,
        ...data.details,
      },
      ipAddress: data.ipAddress,
      success: true,
    });
  }

  getAuditLogs(filters?: {
    action?: AuditAction;
    userId?: string;
    resourceType?: string;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): AuditLog[] {
    
    let logs = this.auditLogs;

    if (filters) {
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.resourceType) {
        logs = logs.filter(log => log.resourceType === filters.resourceType);
      }
      if (filters.severity) {
        logs = logs.filter(log => log.severity === filters.severity);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    const limit = filters?.limit || 100;
    return logs.slice(0, limit);
  }

  getAuditStatistics(period: 'day' | 'week' | 'month' = 'week') {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const periodLogs = this.auditLogs.filter(log => log.timestamp >= startDate);

    const byAction = Object.values(AuditAction).reduce((acc, action) => {
      acc[action] = periodLogs.filter(log => log.action === action).length;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = Object.values(AuditSeverity).reduce((acc, severity) => {
      acc[severity] = periodLogs.filter(log => log.severity === severity).length;
      return acc;
    }, {} as Record<string, number>);

    const uniqueUsers = new Set(periodLogs.map(log => log.userId).filter(Boolean));
    const failedActions = periodLogs.filter(log => !log.success).length;

    return {
      total: periodLogs.length,
      byAction,
      bySeverity,
      uniqueUsers: uniqueUsers.size,
      failedActions,
      successRate: periodLogs.length > 0 
        ? ((periodLogs.length - failedActions) / periodLogs.length) * 100 
        : 100,
    };
  }

  async exportAuditLogs(filters?: {
    startDate?: Date;
    endDate?: Date;
    format?: 'json' | 'csv';
  }): Promise<string> {
    
    const logs = this.getAuditLogs({
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      limit: 10000,
    });

    if (filters?.format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  private async getRolePermissions(): Promise<Record<string, string[]>> {
    try {
      const config = await this.configRepository.findOne({
        where: { configKey: 'role_permissions' },
      });

      return config?.configValue || {
        admin: ['*'],
        moderator: ['faq:read', 'faq:approve', 'faq:reject', 'faq:update'],
        user: ['faq:read'],
      };
    } catch (error) {
      this.logger.error('Failed to load role permissions:', error);
      return {
        admin: ['*'],
        moderator: ['faq:read', 'faq:approve', 'faq:reject'],
        user: ['faq:read'],
      };
    }
  }

  private getRequiredRole(action: string, resourceType: string): string {
    const actionMap: Record<string, string> = {
      'create': 'moderator',
      'update': 'moderator',
      'delete': 'admin',
      'approve': 'moderator',
      'reject': 'moderator',
      'publish': 'moderator',
      'config': 'admin',
      'read': 'user',
    };

    return actionMap[action] || 'user';
  }

  private hasPermission(
    userRole: string,
    requiredRole: string,
    rolePermissions: Record<string, string[]>
  ): boolean {
    
    const roleHierarchy = ['user', 'moderator', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex === -1 || requiredRoleIndex === -1) {
      return false;
    }

    return userRoleIndex >= requiredRoleIndex;
  }

  private convertToCSV(logs: AuditLog[]): string {
    const headers = ['ID', 'Action', 'Severity', 'User', 'Resource Type', 'Resource ID', 'Timestamp', 'Success'];
    const rows = logs.map(log => [
      log.id,
      log.action,
      log.severity,
      log.userName || log.userId || '',
      log.resourceType,
      log.resourceId || '',
      log.timestamp.toISOString(),
      log.success ? 'Yes' : 'No',
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }
}
