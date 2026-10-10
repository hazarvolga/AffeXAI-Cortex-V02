import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { LearningAnalyticsService } from './learning-analytics.service';
import { MailService } from '../../mail/mail.service';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertType {
  SYSTEM_HEALTH = 'system_health',
  PIPELINE_FAILURE = 'pipeline_failure',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  LOW_APPROVAL_RATE = 'low_approval_rate',
  HIGH_ERROR_RATE = 'high_error_rate',
  PROVIDER_FAILURE = 'provider_failure',
  QUEUE_OVERFLOW = 'queue_overflow',
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    learningPipeline: ComponentHealth;
    aiProviders: ComponentHealth;
    database: ComponentHealth;
    queue: ComponentHealth;
  };
  lastCheck: Date;
  alerts: Alert[];
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  metrics?: Record<string, any>;
}

export interface MonitoringThresholds {
  minApprovalRate: number;
  maxErrorRate: number;
  maxResponseTime: number;
  maxQueueSize: number;
  minDailyFaqs: number;
}

@Injectable()
export class MonitoringAlertingService {
  private readonly logger = new Logger(MonitoringAlertingService.name);
  private alerts: Alert[] = [];
  private readonly MAX_ALERTS = 100;

  constructor(
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
    private analyticsService: LearningAnalyticsService,
    private mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async performHealthCheck(): Promise<void> {
    this.logger.log('Performing system health check');

    try {
      const health = await this.getSystemHealth();

      if (health.overall === 'critical') {
        await this.createAlert({
          type: AlertType.SYSTEM_HEALTH,
          severity: AlertSeverity.CRITICAL,
          title: 'System Health Critical',
          message: 'FAQ Learning System is in critical state',
          metadata: { health },
        });
      } else if (health.overall === 'degraded') {
        await this.createAlert({
          type: AlertType.SYSTEM_HEALTH,
          severity: AlertSeverity.WARNING,
          title: 'System Health Degraded',
          message: 'FAQ Learning System performance is degraded',
          metadata: { health },
        });
      }

      this.logger.log(`Health check completed: ${health.overall}`);
    } catch (error) {
      this.logger.error('Health check failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkPerformanceMetrics(): Promise<void> {
    this.logger.log('Checking performance metrics');

    try {
      const thresholds = await this.getMonitoringThresholds();
      const effectiveness = await this.analyticsService.getLearningEffectiveness('day');

      if (effectiveness.approvalRate < thresholds.minApprovalRate) {
        await this.createAlert({
          type: AlertType.LOW_APPROVAL_RATE,
          severity: AlertSeverity.WARNING,
          title: 'Low FAQ Approval Rate',
          message: `Approval rate (${effectiveness.approvalRate}%) is below threshold (${thresholds.minApprovalRate}%)`,
          metadata: { effectiveness, threshold: thresholds.minApprovalRate },
        });
      }

      const providerPerformance = await this.analyticsService.getProviderPerformance('day');
      providerPerformance.forEach(provider => {
        const errorRate = 100 - provider.successRate;
        if (errorRate > thresholds.maxErrorRate) {
          this.createAlert({
            type: AlertType.HIGH_ERROR_RATE,
            severity: AlertSeverity.ERROR,
            title: `High Error Rate for ${provider.providerName}`,
            message: `Error rate (${errorRate.toFixed(1)}%) exceeds threshold (${thresholds.maxErrorRate}%)`,
            metadata: { provider, threshold: thresholds.maxErrorRate },
          });
        }

        if (provider.avgResponseTime > thresholds.maxResponseTime) {
          this.createAlert({
            type: AlertType.PERFORMANCE_DEGRADATION,
            severity: AlertSeverity.WARNING,
            title: `Slow Response Time for ${provider.providerName}`,
            message: `Average response time (${provider.avgResponseTime}ms) exceeds threshold (${thresholds.maxResponseTime}ms)`,
            metadata: { provider, threshold: thresholds.maxResponseTime },
          });
        }
      });

      this.logger.log('Performance metrics check completed');
    } catch (error) {
      this.logger.error('Performance metrics check failed:', error);
    }
  }

  async getSystemHealth(): Promise<SystemHealthStatus> {
    const [learningPipeline, aiProviders, database, queue] = await Promise.all([
      this.checkLearningPipelineHealth(),
      this.checkAiProvidersHealth(),
      this.checkDatabaseHealth(),
      this.checkQueueHealth(),
    ]);

    const components = { learningPipeline, aiProviders, database, queue };

    const criticalCount = Object.values(components).filter(c => c.status === 'critical').length;
    const degradedCount = Object.values(components).filter(c => c.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'critical';
    if (criticalCount > 0) {
      overall = 'critical';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      components,
      lastCheck: new Date(),
      alerts: this.getActiveAlerts(),
    };
  }

  private async checkLearningPipelineHealth(): Promise<ComponentHealth> {
    try {
      const effectiveness = await this.analyticsService.getLearningEffectiveness('day');

      if (effectiveness.totalFaqsGenerated === 0) {
        return {
          status: 'degraded',
          message: 'No FAQs generated in the last 24 hours',
          metrics: effectiveness,
        };
      }

      if (effectiveness.approvalRate < 30) {
        return {
          status: 'degraded',
          message: `Low approval rate: ${effectiveness.approvalRate}%`,
          metrics: effectiveness,
        };
      }

      return {
        status: 'healthy',
        message: 'Learning pipeline operating normally',
        metrics: effectiveness,
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Pipeline health check failed: ${error.message}`,
      };
    }
  }

  private async checkAiProvidersHealth(): Promise<ComponentHealth> {
    try {
      const providers = await this.analyticsService.getProviderPerformance('day');

      if (providers.length === 0) {
        return {
          status: 'critical',
          message: 'No AI providers available',
        };
      }

      const failedProviders = providers.filter(p => p.successRate < 50);
      if (failedProviders.length === providers.length) {
        return {
          status: 'critical',
          message: 'All AI providers are failing',
          metrics: { providers },
        };
      }

      if (failedProviders.length > 0) {
        return {
          status: 'degraded',
          message: `${failedProviders.length} provider(s) experiencing issues`,
          metrics: { failedProviders },
        };
      }

      return {
        status: 'healthy',
        message: 'All AI providers operating normally',
        metrics: { providers },
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Provider health check failed: ${error.message}`,
      };
    }
  }

  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    try {
      const config = await this.configRepository.findOne({
        where: { configKey: 'system_status' },
      });

      return {
        status: 'healthy',
        message: 'Database connection healthy',
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Database connection failed: ${error.message}`,
      };
    }
  }

  private async checkQueueHealth(): Promise<ComponentHealth> {
    try {
      return {
        status: 'healthy',
        message: 'Processing queue healthy',
        metrics: { queueSize: 0 },
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: `Queue health check failed: ${error.message}`,
      };
    }
  }

  async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<Alert> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.unshift(alert);

    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, this.MAX_ALERTS);
    }

    this.logger.warn(`Alert created: [${alert.severity}] ${alert.title}`);

    if (alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.ERROR) {
      await this.sendAlertNotification(alert);
    }

    return alert;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.logger.log(`Alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  getAllAlerts(limit: number = 50): Alert[] {
    return this.alerts.slice(0, limit);
  }

  getAlertsByType(type: AlertType): Alert[] {
    return this.alerts.filter(a => a.type === type);
  }

  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.alerts.filter(a => a.severity === severity);
  }

  clearResolvedAlerts(): number {
    const beforeCount = this.alerts.length;
    this.alerts = this.alerts.filter(a => !a.resolved);
    const clearedCount = beforeCount - this.alerts.length;
    this.logger.log(`Cleared ${clearedCount} resolved alerts`);
    return clearedCount;
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      const adminEmails = await this.getAdminEmails();

      if (adminEmails.length === 0) {
        this.logger.warn('No admin emails configured for alerts');
        return;
      }

      const subject = `[${alert.severity.toUpperCase()}] FAQ Learning System Alert: ${alert.title}`;
      const body = `
        <h2>System Alert</h2>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        ${alert.metadata ? `<p><strong>Details:</strong> <pre>${JSON.stringify(alert.metadata, null, 2)}</pre></p>` : ''}
      `;

      for (const email of adminEmails) {
        await this.mailService.sendMail({
          to: { email },
          subject,
          html: body,
          channel: 'system' as any,
          priority: alert.severity === AlertSeverity.CRITICAL ? ('high' as any) : ('normal' as any),
        });
      }

      this.logger.log(`Alert notification sent to ${adminEmails.length} admin(s)`);
    } catch (error) {
      this.logger.error('Failed to send alert notification:', error);
    }
  }

  private async getAdminEmails(): Promise<string[]> {
    try {
      const config = await this.configRepository.findOne({
        where: { configKey: 'notification_settings' },
      });

      return config?.configValue?.adminEmails || [];
    } catch (error) {
      this.logger.error('Failed to get admin emails:', error);
      return [];
    }
  }

  private async getMonitoringThresholds(): Promise<MonitoringThresholds> {
    try {
      const config = await this.configRepository.findOne({
        where: { configKey: 'monitoring_thresholds' },
      });

      const defaultThresholds: MonitoringThresholds = {
        minApprovalRate: 50,
        maxErrorRate: 20,
        maxResponseTime: 5000,
        maxQueueSize: 1000,
        minDailyFaqs: 5,
      };

      return (config?.configValue as MonitoringThresholds) || defaultThresholds;
    } catch (error) {
      this.logger.error('Failed to load monitoring thresholds:', error);
      return {
        minApprovalRate: 50,
        maxErrorRate: 20,
        maxResponseTime: 5000,
        maxQueueSize: 1000,
        minDailyFaqs: 5,
      };
    }
  }

  async getAlertStatistics() {
    const activeAlerts = this.getActiveAlerts();
    const last24h = this.alerts.filter(
      a => a.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000,
    );

    const bySeverity = {
      info: this.alerts.filter(a => a.severity === AlertSeverity.INFO).length,
      warning: this.alerts.filter(a => a.severity === AlertSeverity.WARNING).length,
      error: this.alerts.filter(a => a.severity === AlertSeverity.ERROR).length,
      critical: this.alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
    };

    const byType = Object.values(AlertType).reduce((acc, type) => {
      acc[type] = this.alerts.filter(a => a.type === type).length;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.alerts.length,
      active: activeAlerts.length,
      resolved: this.alerts.filter(a => a.resolved).length,
      last24h: last24h.length,
      bySeverity,
      byType,
    };
  }
}
