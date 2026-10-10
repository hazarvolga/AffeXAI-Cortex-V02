/**
 * Bulk Operation Metrics Collection and Monitoring System
 * 
 * Provides comprehensive metrics collection, aggregation, and monitoring
 * for bulk import/export operations including:
 * - Real-time performance metrics
 * - System resource monitoring
 * - Business metrics tracking
 * - Alert thresholds and notifications
 */

import { bulkOperationLogger, LogLevel, LogCategory, PerformanceMetrics } from '../logging/bulk-operation-logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SystemMetrics {
  timestamp: Date;
  memoryUsage: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  activeConnections: number;
  queueSize: number;
  diskUsage?: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
}

export interface BusinessMetrics {
  timestamp: Date;
  totalImportsToday: number;
  totalExportsToday: number;
  totalRecordsProcessed: number;
  averageValidationRate: number;
  averageProcessingTime: number;
  errorRate: number;
  userSatisfactionScore?: number;
  activeUsers: number;
}

export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export interface MetricAlert {
  id: string;
  timestamp: Date;
  threshold: AlertThreshold;
  currentValue: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface MetricsSummary {
  timeRange: { start: Date; end: Date };
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageThroughput: number;
  peakThroughput: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  totalErrorCount: number;
  mostCommonErrors: Array<{ type: string; count: number }>;
  performanceTrends: {
    throughputTrend: 'improving' | 'stable' | 'declining';
    errorRateTrend: 'improving' | 'stable' | 'declining';
    memoryUsageTrend: 'improving' | 'stable' | 'declining';
  };
}

// ============================================================================
// Metrics Collector Implementation
// ============================================================================

export class BulkOperationMetricsCollector {
  private systemMetrics: Map<string, SystemMetrics> = new Map();
  private businessMetrics: Map<string, BusinessMetrics> = new Map();
  private alerts: Map<string, MetricAlert> = new Map();
  private alertThresholds: Map<string, AlertThreshold> = new Map();
  private collectionInterval: NodeJS.Timeout | null = null;
  private isCollecting = false;

  constructor() {
    this.initializeDefaultThresholds();
  }

  /**
   * Start metrics collection
   */
  startCollection(intervalMs: number = 30000): void {
    if (this.isCollecting) {
      return;
    }

    this.isCollecting = true;
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    bulkOperationLogger.log(
      LogLevel.INFO,
      LogCategory.OPERATION,
      'Started metrics collection',
      { userId: 'system' },
      { intervalMs }
    );
  }

  /**
   * Stop metrics collection
   */
  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    this.isCollecting = false;

    bulkOperationLogger.log(
      LogLevel.INFO,
      LogCategory.OPERATION,
      'Stopped metrics collection',
      { userId: 'system' }
    );
  }

  /**
   * Collect current system and business metrics
   */
  async collectMetrics(): Promise<void> {
    try {
      const timestamp = new Date();
      
      // Collect system metrics
      const systemMetrics = await this.collectSystemMetrics(timestamp);
      this.systemMetrics.set(timestamp.toISOString(), systemMetrics);

      // Collect business metrics
      const businessMetrics = await this.collectBusinessMetrics(timestamp);
      this.businessMetrics.set(timestamp.toISOString(), businessMetrics);

      // Check alert thresholds
      await this.checkAlertThresholds(systemMetrics, businessMetrics);

      // Clean up old metrics (keep last 24 hours)
      this.cleanupOldMetrics();

    } catch (error) {
      bulkOperationLogger.log(
        LogLevel.ERROR,
        LogCategory.PERFORMANCE,
        'Failed to collect metrics',
        { userId: 'system' },
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Record operation metrics
   */
  recordOperationMetrics(
    operationType: 'import' | 'export',
    metrics: {
      duration: number;
      recordsProcessed: number;
      errorCount: number;
      memoryUsed?: number;
      success: boolean;
    }
  ): void {
    const throughput = metrics.recordsProcessed / (metrics.duration / 1000);

    bulkOperationLogger.log(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      `Operation metrics recorded: ${operationType}`,
      { userId: 'system', operation: operationType },
      {
        duration: metrics.duration,
        recordsProcessed: metrics.recordsProcessed,
        throughput: Math.round(throughput * 100) / 100,
        errorCount: metrics.errorCount,
        memoryUsed: metrics.memoryUsed,
        success: metrics.success
      }
    );

    // Update business metrics
    this.updateBusinessMetrics(operationType, metrics);
  }

  /**
   * Get system metrics for a time range
   */
  getSystemMetrics(startTime: Date, endTime: Date): SystemMetrics[] {
    const metrics: SystemMetrics[] = [];

    for (const [timestamp, metric] of this.systemMetrics.entries()) {
      const metricTime = new Date(timestamp);
      if (metricTime >= startTime && metricTime <= endTime) {
        metrics.push(metric);
      }
    }

    return metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get business metrics for a time range
   */
  getBusinessMetrics(startTime: Date, endTime: Date): BusinessMetrics[] {
    const metrics: BusinessMetrics[] = [];

    for (const [timestamp, metric] of this.businessMetrics.entries()) {
      const metricTime = new Date(timestamp);
      if (metricTime >= startTime && metricTime <= endTime) {
        metrics.push(metric);
      }
    }

    return metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get metrics summary for a time range
   */
  getMetricsSummary(startTime: Date, endTime: Date): MetricsSummary {
    const performanceMetrics = bulkOperationLogger.getPerformanceMetrics();
    const systemMetrics = this.getSystemMetrics(startTime, endTime);
    const businessMetrics = this.getBusinessMetrics(startTime, endTime);
    const errorStats = bulkOperationLogger.getErrorStatistics({ start: startTime, end: endTime });

    // Filter performance metrics by time range
    const filteredPerformanceMetrics = performanceMetrics.filter(
      m => m.startTime >= startTime && m.startTime <= endTime
    );

    const totalOperations = filteredPerformanceMetrics.length;
    const successfulOperations = filteredPerformanceMetrics.filter(m => m.errorCount === 0).length;
    const failedOperations = totalOperations - successfulOperations;

    const throughputs = filteredPerformanceMetrics.map(m => m.throughput);
    const averageThroughput = throughputs.length > 0 
      ? throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length 
      : 0;
    const peakThroughput = throughputs.length > 0 ? Math.max(...throughputs) : 0;

    const memoryUsages = systemMetrics.map(m => m.memoryUsage.percentage);
    const averageMemoryUsage = memoryUsages.length > 0
      ? memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length
      : 0;
    const peakMemoryUsage = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0;

    // Calculate trends (simplified)
    const recentMetrics = filteredPerformanceMetrics.slice(-10);
    const olderMetrics = filteredPerformanceMetrics.slice(0, -10);

    const recentAvgThroughput = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length
      : 0;
    const olderAvgThroughput = olderMetrics.length > 0
      ? olderMetrics.reduce((sum, m) => sum + m.throughput, 0) / olderMetrics.length
      : 0;

    const throughputTrend = recentAvgThroughput > olderAvgThroughput * 1.05 ? 'improving' :
                           recentAvgThroughput < olderAvgThroughput * 0.95 ? 'declining' : 'stable';

    const recentErrorRate = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.errorCount, 0) / recentMetrics.length
      : 0;
    const olderErrorRate = olderMetrics.length > 0
      ? olderMetrics.reduce((sum, m) => sum + m.errorCount, 0) / olderMetrics.length
      : 0;

    const errorRateTrend = recentErrorRate < olderErrorRate * 0.95 ? 'improving' :
                          recentErrorRate > olderErrorRate * 1.05 ? 'declining' : 'stable';

    const recentMemoryUsage = systemMetrics.slice(-10);
    const olderMemoryUsage = systemMetrics.slice(0, -10);

    const recentAvgMemory = recentMemoryUsage.length > 0
      ? recentMemoryUsage.reduce((sum, m) => sum + m.memoryUsage.percentage, 0) / recentMemoryUsage.length
      : 0;
    const olderAvgMemory = olderMemoryUsage.length > 0
      ? olderMemoryUsage.reduce((sum, m) => sum + m.memoryUsage.percentage, 0) / olderMemoryUsage.length
      : 0;

    const memoryUsageTrend = recentAvgMemory < olderAvgMemory * 0.95 ? 'improving' :
                            recentAvgMemory > olderAvgMemory * 1.05 ? 'declining' : 'stable';

    // Get most common errors
    const mostCommonErrors = Object.entries(errorStats.errorsByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      timeRange: { start: startTime, end: endTime },
      totalOperations,
      successfulOperations,
      failedOperations,
      averageThroughput: Math.round(averageThroughput * 100) / 100,
      peakThroughput: Math.round(peakThroughput * 100) / 100,
      averageMemoryUsage: Math.round(averageMemoryUsage * 100) / 100,
      peakMemoryUsage: Math.round(peakMemoryUsage * 100) / 100,
      totalErrorCount: errorStats.totalErrors,
      mostCommonErrors,
      performanceTrends: {
        throughputTrend,
        errorRateTrend,
        memoryUsageTrend
      }
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): MetricAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged && !alert.resolvedAt)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Add or update alert threshold
   */
  setAlertThreshold(name: string, threshold: AlertThreshold): void {
    this.alertThresholds.set(name, threshold);
    
    bulkOperationLogger.log(
      LogLevel.INFO,
      LogCategory.OPERATION,
      `Alert threshold updated: ${name}`,
      { userId: 'system' },
      { threshold }
    );
  }

  /**
   * Remove alert threshold
   */
  removeAlertThreshold(name: string): boolean {
    const removed = this.alertThresholds.delete(name);
    
    if (removed) {
      bulkOperationLogger.log(
        LogLevel.INFO,
        LogCategory.OPERATION,
        `Alert threshold removed: ${name}`,
        { userId: 'system' }
      );
    }

    return removed;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async collectSystemMetrics(timestamp: Date): Promise<SystemMetrics> {
    // In a real implementation, this would collect actual system metrics
    // For now, we'll simulate the metrics collection
    
    const memoryUsage = process.memoryUsage();
    const totalMemory = 1024 * 1024 * 1024 * 4; // Simulate 4GB total memory
    const usedMemory = memoryUsage.heapUsed + memoryUsage.external;
    const freeMemory = totalMemory - usedMemory;

    return {
      timestamp,
      memoryUsage: {
        used: usedMemory,
        free: freeMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      cpuUsage: Math.random() * 100, // Simulate CPU usage
      activeConnections: Math.floor(Math.random() * 100) + 10,
      queueSize: Math.floor(Math.random() * 50)
    };
  }

  private async collectBusinessMetrics(timestamp: Date): Promise<BusinessMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const performanceMetrics = bulkOperationLogger.getPerformanceMetrics();
    const todayMetrics = performanceMetrics.filter(m => m.startTime >= today);

    const importMetrics = todayMetrics.filter(m => m.operationName.includes('import'));
    const exportMetrics = todayMetrics.filter(m => m.operationName.includes('export'));

    const totalRecordsProcessed = todayMetrics.reduce((sum, m) => sum + m.recordsProcessed, 0);
    const averageProcessingTime = todayMetrics.length > 0
      ? todayMetrics.reduce((sum, m) => sum + m.duration, 0) / todayMetrics.length
      : 0;

    const totalErrors = todayMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    const errorRate = todayMetrics.length > 0 ? (totalErrors / todayMetrics.length) * 100 : 0;

    return {
      timestamp,
      totalImportsToday: importMetrics.length,
      totalExportsToday: exportMetrics.length,
      totalRecordsProcessed,
      averageValidationRate: 95, // This would be calculated from actual validation results
      averageProcessingTime,
      errorRate,
      activeUsers: Math.floor(Math.random() * 20) + 5 // Simulate active users
    };
  }

  private async checkAlertThresholds(
    systemMetrics: SystemMetrics,
    businessMetrics: BusinessMetrics
  ): Promise<void> {
    const metricsToCheck = {
      'memory_usage_percentage': systemMetrics.memoryUsage.percentage,
      'cpu_usage': systemMetrics.cpuUsage,
      'queue_size': systemMetrics.queueSize,
      'error_rate': businessMetrics.errorRate,
      'active_connections': systemMetrics.activeConnections
    };

    for (const [metricName, currentValue] of Object.entries(metricsToCheck)) {
      const threshold = this.alertThresholds.get(metricName);
      
      if (!threshold || !threshold.enabled) {
        continue;
      }

      // Check cooldown period
      if (threshold.lastTriggered) {
        const cooldownMs = threshold.cooldownMinutes * 60 * 1000;
        const timeSinceLastTrigger = Date.now() - threshold.lastTriggered.getTime();
        
        if (timeSinceLastTrigger < cooldownMs) {
          continue;
        }
      }

      // Check if threshold is breached
      const isBreached = this.checkThresholdCondition(currentValue, threshold);

      if (isBreached) {
        await this.triggerAlert(metricName, threshold, currentValue);
      }
    }
  }

  private checkThresholdCondition(value: number, threshold: AlertThreshold): boolean {
    switch (threshold.operator) {
      case 'gt': return value > threshold.value;
      case 'gte': return value >= threshold.value;
      case 'lt': return value < threshold.value;
      case 'lte': return value <= threshold.value;
      case 'eq': return value === threshold.value;
      default: return false;
    }
  }

  private async triggerAlert(
    metricName: string,
    threshold: AlertThreshold,
    currentValue: number
  ): Promise<void> {
    const alert: MetricAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      threshold,
      currentValue,
      message: `${metricName} ${threshold.operator} ${threshold.value} (current: ${currentValue})`,
      severity: threshold.severity,
      acknowledged: false
    };

    this.alerts.set(alert.id, alert);
    threshold.lastTriggered = new Date();

    bulkOperationLogger.log(
      threshold.severity === 'critical' ? LogLevel.FATAL : LogLevel.ERROR,
      LogCategory.PERFORMANCE,
      `Alert triggered: ${alert.message}`,
      { userId: 'system' },
      {
        alertId: alert.id,
        metricName,
        threshold: threshold.value,
        currentValue,
        severity: threshold.severity
      }
    );

    // In a real implementation, this would send notifications
    console.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
  }

  private updateBusinessMetrics(
    operationType: 'import' | 'export',
    metrics: {
      duration: number;
      recordsProcessed: number;
      errorCount: number;
      success: boolean;
    }
  ): void {
    // This would update running business metrics
    // For now, we just log the update
    bulkOperationLogger.log(
      LogLevel.DEBUG,
      LogCategory.PERFORMANCE,
      `Business metrics updated for ${operationType}`,
      { userId: 'system', operation: operationType },
      metrics
    );
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Clean up system metrics
    for (const [timestamp] of this.systemMetrics.entries()) {
      if (new Date(timestamp) < cutoffTime) {
        this.systemMetrics.delete(timestamp);
      }
    }

    // Clean up business metrics
    for (const [timestamp] of this.businessMetrics.entries()) {
      if (new Date(timestamp) < cutoffTime) {
        this.businessMetrics.delete(timestamp);
      }
    }

    // Clean up resolved alerts older than 7 days
    const alertCutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolvedAt && alert.resolvedAt < alertCutoffTime) {
        this.alerts.delete(id);
      }
    }
  }

  private initializeDefaultThresholds(): void {
    const defaultThresholds: Array<[string, AlertThreshold]> = [
      ['memory_usage_percentage', {
        metric: 'memory_usage_percentage',
        operator: 'gt',
        value: 85,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 15
      }],
      ['cpu_usage', {
        metric: 'cpu_usage',
        operator: 'gt',
        value: 90,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 10
      }],
      ['queue_size', {
        metric: 'queue_size',
        operator: 'gt',
        value: 100,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 5
      }],
      ['error_rate', {
        metric: 'error_rate',
        operator: 'gt',
        value: 10,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 30
      }]
    ];

    for (const [name, threshold] of defaultThresholds) {
      this.alertThresholds.set(name, threshold);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const bulkOperationMetrics = new BulkOperationMetricsCollector();
export default bulkOperationMetrics;