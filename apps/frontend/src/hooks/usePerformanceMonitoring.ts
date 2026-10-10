'use client';

/**
 * Performance Monitoring Hook
 * 
 * React hook for monitoring and optimizing bulk operation performance including:
 * - Real-time performance metrics
 * - Resource usage tracking
 * - Automatic optimization suggestions
 * - Performance alerts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { bulkOperationLogger, LogLevel, LogCategory } from '@/lib/logging/bulk-operation-logger';

// ============================================================================
// Types
// ============================================================================

interface PerformanceMetrics {
  timestamp: Date;
  operationType: 'import' | 'export' | 'validation';
  duration: number;
  recordsProcessed: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  errorCount: number;
  successRate: number;
}

interface ResourceUsage {
  timestamp: Date;
  memoryUsed: number;
  memoryTotal: number;
  memoryPercentage: number;
  cpuUsage: number;
  activeConnections: number;
  queueSize: number;
}

interface PerformanceAlert {
  id: string;
  timestamp: Date;
  type: 'memory' | 'cpu' | 'throughput' | 'error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  suggestion?: string;
}

interface OptimizationSuggestion {
  id: string;
  type: 'batch_size' | 'memory_limit' | 'parallelism' | 'caching';
  title: string;
  description: string;
  currentValue: any;
  suggestedValue: any;
  expectedImprovement: string;
  priority: 'low' | 'medium' | 'high';
}

interface PerformanceProfile {
  operationType: 'import' | 'export' | 'validation';
  dataSize: 'small' | 'medium' | 'large' | 'xlarge';
  recommendedBatchSize: number;
  recommendedChunkSize: number;
  recommendedParallelism: number;
  memoryLimit: number;
  estimatedDuration: number;
}

interface UsePerformanceMonitoringOptions {
  enableRealTimeMonitoring?: boolean;
  monitoringInterval?: number;
  alertThresholds?: {
    memoryUsage?: number;
    cpuUsage?: number;
    errorRate?: number;
    throughputMin?: number;
  };
  autoOptimize?: boolean;
}

interface UsePerformanceMonitoringReturn {
  // Current metrics
  currentMetrics: PerformanceMetrics | null;
  resourceUsage: ResourceUsage | null;
  
  // Historical data
  metricsHistory: PerformanceMetrics[];
  resourceHistory: ResourceUsage[];
  
  // Alerts and suggestions
  activeAlerts: PerformanceAlert[];
  optimizationSuggestions: OptimizationSuggestion[];
  
  // Performance profile
  currentProfile: PerformanceProfile | null;
  
  // Control functions
  startMonitoring: (operationType: 'import' | 'export' | 'validation') => void;
  stopMonitoring: () => void;
  recordOperation: (metrics: Partial<PerformanceMetrics>) => void;
  acknowledgeAlert: (alertId: string) => void;
  applyOptimization: (suggestionId: string) => void;
  getOptimalSettings: (recordCount: number, operationType: 'import' | 'export' | 'validation') => PerformanceProfile;
  
  // State
  isMonitoring: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePerformanceMonitoring(
  options: UsePerformanceMonitoringOptions = {}
): UsePerformanceMonitoringReturn {
  const {
    enableRealTimeMonitoring = true,
    monitoringInterval = 5000,
    alertThresholds = {
      memoryUsage: 85,
      cpuUsage: 90,
      errorRate: 10,
      throughputMin: 100
    },
    autoOptimize = false
  } = options;

  // State
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [resourceHistory, setResourceHistory] = useState<ResourceUsage[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<PerformanceAlert[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [currentProfile, setCurrentProfile] = useState<PerformanceProfile | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentOperationType = useRef<'import' | 'export' | 'validation' | null>(null);

  // ============================================================================
  // Monitoring Functions
  // ============================================================================

  const collectResourceMetrics = useCallback(async (): Promise<ResourceUsage> => {
    try {
      // In a real implementation, this would collect actual system metrics
      // For now, we'll simulate the metrics
      const memoryUsage = (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        percentage: ((performance as any).memory.usedJSHeapSize / (performance as any).memory.totalJSHeapSize) * 100
      } : {
        used: Math.random() * 1024 * 1024 * 1024, // Random value for demo
        total: 4 * 1024 * 1024 * 1024, // 4GB
        percentage: Math.random() * 100
      };

      return {
        timestamp: new Date(),
        memoryUsed: memoryUsage.used,
        memoryTotal: memoryUsage.total,
        memoryPercentage: memoryUsage.percentage,
        cpuUsage: Math.random() * 100, // Simulated CPU usage
        activeConnections: Math.floor(Math.random() * 50) + 10,
        queueSize: Math.floor(Math.random() * 20)
      };
    } catch (err) {
      console.error('Failed to collect resource metrics:', err);
      throw err;
    }
  }, []);

  const checkAlertThresholds = useCallback((
    metrics: PerformanceMetrics | null,
    resources: ResourceUsage | null
  ) => {
    const newAlerts: PerformanceAlert[] = [];

    if (resources) {
      // Memory usage alert
      if (resources.memoryPercentage > alertThresholds.memoryUsage!) {
        newAlerts.push({
          id: `memory_${Date.now()}`,
          timestamp: new Date(),
          type: 'memory',
          severity: resources.memoryPercentage > 95 ? 'critical' : 'high',
          message: `Memory usage is ${resources.memoryPercentage.toFixed(1)}%`,
          currentValue: resources.memoryPercentage,
          threshold: alertThresholds.memoryUsage!,
          suggestion: 'Consider reducing batch size or enabling streaming processing'
        });
      }

      // CPU usage alert
      if (resources.cpuUsage > alertThresholds.cpuUsage!) {
        newAlerts.push({
          id: `cpu_${Date.now()}`,
          timestamp: new Date(),
          type: 'cpu',
          severity: resources.cpuUsage > 95 ? 'critical' : 'high',
          message: `CPU usage is ${resources.cpuUsage.toFixed(1)}%`,
          currentValue: resources.cpuUsage,
          threshold: alertThresholds.cpuUsage!,
          suggestion: 'Consider reducing parallelism or adding delays between operations'
        });
      }
    }

    if (metrics) {
      // Error rate alert
      const errorRate = (metrics.errorCount / metrics.recordsProcessed) * 100;
      if (errorRate > alertThresholds.errorRate!) {
        newAlerts.push({
          id: `error_rate_${Date.now()}`,
          timestamp: new Date(),
          type: 'error_rate',
          severity: errorRate > 25 ? 'critical' : 'medium',
          message: `Error rate is ${errorRate.toFixed(1)}%`,
          currentValue: errorRate,
          threshold: alertThresholds.errorRate!,
          suggestion: 'Review data quality and validation rules'
        });
      }

      // Throughput alert
      if (metrics.throughput < alertThresholds.throughputMin!) {
        newAlerts.push({
          id: `throughput_${Date.now()}`,
          timestamp: new Date(),
          type: 'throughput',
          severity: 'medium',
          message: `Throughput is ${metrics.throughput.toFixed(1)} records/sec`,
          currentValue: metrics.throughput,
          threshold: alertThresholds.throughputMin!,
          suggestion: 'Consider increasing batch size or optimizing queries'
        });
      }
    }

    if (newAlerts.length > 0) {
      setActiveAlerts(prev => [...prev, ...newAlerts]);
      
      // Log alerts
      newAlerts.forEach(alert => {
        bulkOperationLogger.log(
          alert.severity === 'critical' ? LogLevel.FATAL : LogLevel.WARN,
          LogCategory.PERFORMANCE,
          `Performance alert: ${alert.message}`,
          { userId: 'system', operation: 'performance_alert' },
          { alertType: alert.type, severity: alert.severity, suggestion: alert.suggestion }
        );
      });
    }
  }, [alertThresholds]);

  const generateOptimizationSuggestions = useCallback((
    metrics: PerformanceMetrics[],
    resources: ResourceUsage[]
  ) => {
    const suggestions: OptimizationSuggestion[] = [];

    if (metrics.length === 0 || resources.length === 0) return;

    const recentMetrics = metrics.slice(-10);
    const recentResources = resources.slice(-10);

    // Analyze average performance
    const avgThroughput = recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length;
    const avgMemoryUsage = recentResources.reduce((sum, r) => sum + r.memoryPercentage, 0) / recentResources.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + (m.errorCount / m.recordsProcessed * 100), 0) / recentMetrics.length;

    // Batch size optimization
    if (avgThroughput < 500 && avgMemoryUsage < 60) {
      suggestions.push({
        id: 'batch_size_increase',
        type: 'batch_size',
        title: 'Increase Batch Size',
        description: 'Low memory usage suggests you can process larger batches for better throughput',
        currentValue: 1000,
        suggestedValue: 2000,
        expectedImprovement: '30-50% throughput increase',
        priority: 'medium'
      });
    }

    if (avgMemoryUsage > 80) {
      suggestions.push({
        id: 'batch_size_decrease',
        type: 'batch_size',
        title: 'Reduce Batch Size',
        description: 'High memory usage suggests smaller batches would be more efficient',
        currentValue: 2000,
        suggestedValue: 1000,
        expectedImprovement: '20-30% memory reduction',
        priority: 'high'
      });
    }

    // Caching optimization
    if (avgErrorRate < 5 && currentOperationType.current === 'validation') {
      suggestions.push({
        id: 'enable_caching',
        type: 'caching',
        title: 'Enable Validation Caching',
        description: 'Low error rate suggests validation results can be cached safely',
        currentValue: false,
        suggestedValue: true,
        expectedImprovement: '40-60% validation speed increase',
        priority: 'high'
      });
    }

    // Parallelism optimization
    const avgCpuUsage = recentResources.reduce((sum, r) => sum + r.cpuUsage, 0) / recentResources.length;
    if (avgCpuUsage < 50 && avgThroughput < 1000) {
      suggestions.push({
        id: 'increase_parallelism',
        type: 'parallelism',
        title: 'Increase Parallelism',
        description: 'Low CPU usage suggests you can process more operations in parallel',
        currentValue: 2,
        suggestedValue: 4,
        expectedImprovement: '50-80% throughput increase',
        priority: 'medium'
      });
    }

    setOptimizationSuggestions(suggestions);
  }, []);

  // ============================================================================
  // Control Functions
  // ============================================================================

  const startMonitoring = useCallback((operationType: 'import' | 'export' | 'validation') => {
    if (isMonitoring) return;

    currentOperationType.current = operationType;
    setIsMonitoring(true);
    setError(null);

    // Get performance profile for operation
    const profile = getOptimalSettings(1000, operationType); // Default to medium size
    setCurrentProfile(profile);

    if (enableRealTimeMonitoring) {
      monitoringIntervalRef.current = setInterval(async () => {
        try {
          const resources = await collectResourceMetrics();
          setResourceUsage(resources);
          
          // Add to history
          setResourceHistory(prev => {
            const updated = [...prev, resources];
            // Keep only last 100 entries
            return updated.slice(-100);
          });

          // Check for alerts
          checkAlertThresholds(currentMetrics, resources);

        } catch (err) {
          console.error('Monitoring error:', err);
          setError(err instanceof Error ? err.message : 'Monitoring failed');
        }
      }, monitoringInterval);
    }

    bulkOperationLogger.log(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      `Performance monitoring started for ${operationType}`,
      { userId: 'system', operation: 'start_monitoring' },
      { operationType, monitoringInterval }
    );
  }, [isMonitoring, enableRealTimeMonitoring, monitoringInterval, collectResourceMetrics, checkAlertThresholds, currentMetrics]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    setIsMonitoring(false);
    currentOperationType.current = null;

    // Generate optimization suggestions based on collected data
    generateOptimizationSuggestions(metricsHistory, resourceHistory);

    bulkOperationLogger.log(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      'Performance monitoring stopped',
      { userId: 'system', operation: 'stop_monitoring' }
    );
  }, [isMonitoring, generateOptimizationSuggestions, metricsHistory, resourceHistory]);

  const recordOperation = useCallback((metrics: Partial<PerformanceMetrics>) => {
    const fullMetrics: PerformanceMetrics = {
      timestamp: new Date(),
      operationType: currentOperationType.current || 'import',
      duration: 0,
      recordsProcessed: 0,
      throughput: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      errorCount: 0,
      successRate: 100,
      ...metrics
    };

    // Calculate derived metrics
    if (fullMetrics.duration > 0 && fullMetrics.recordsProcessed > 0) {
      fullMetrics.throughput = fullMetrics.recordsProcessed / (fullMetrics.duration / 1000);
    }

    if (fullMetrics.recordsProcessed > 0) {
      fullMetrics.successRate = ((fullMetrics.recordsProcessed - fullMetrics.errorCount) / fullMetrics.recordsProcessed) * 100;
    }

    setCurrentMetrics(fullMetrics);
    
    // Add to history
    setMetricsHistory(prev => {
      const updated = [...prev, fullMetrics];
      // Keep only last 100 entries
      return updated.slice(-100);
    });

    // Check for alerts
    checkAlertThresholds(fullMetrics, resourceUsage);

    bulkOperationLogger.log(
      LogLevel.DEBUG,
      LogCategory.PERFORMANCE,
      `Operation metrics recorded`,
      { userId: 'system', operation: 'record_metrics' },
      {
        operationType: fullMetrics.operationType,
        duration: fullMetrics.duration,
        recordsProcessed: fullMetrics.recordsProcessed,
        throughput: Math.round(fullMetrics.throughput * 100) / 100,
        successRate: Math.round(fullMetrics.successRate * 100) / 100
      }
    );
  }, [checkAlertThresholds, resourceUsage]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
    
    bulkOperationLogger.log(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      `Performance alert acknowledged`,
      { userId: 'system', operation: 'acknowledge_alert' },
      { alertId }
    );
  }, []);

  const applyOptimization = useCallback((suggestionId: string) => {
    const suggestion = optimizationSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // In a real implementation, this would apply the optimization
    // For now, we'll just remove the suggestion and log it
    setOptimizationSuggestions(prev => prev.filter(s => s.id !== suggestionId));

    bulkOperationLogger.log(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      `Optimization applied: ${suggestion.title}`,
      { userId: 'system', operation: 'apply_optimization' },
      {
        suggestionId,
        type: suggestion.type,
        currentValue: suggestion.currentValue,
        suggestedValue: suggestion.suggestedValue
      }
    );
  }, [optimizationSuggestions]);

  const getOptimalSettings = useCallback((
    recordCount: number,
    operationType: 'import' | 'export' | 'validation'
  ): PerformanceProfile => {
    // Categorize data size
    let dataSize: 'small' | 'medium' | 'large' | 'xlarge';
    if (recordCount > 100000) dataSize = 'xlarge';
    else if (recordCount > 10000) dataSize = 'large';
    else if (recordCount > 1000) dataSize = 'medium';
    else dataSize = 'small';

    // Base profile
    let profile: PerformanceProfile = {
      operationType,
      dataSize,
      recommendedBatchSize: 1000,
      recommendedChunkSize: 1000,
      recommendedParallelism: 2,
      memoryLimit: 256 * 1024 * 1024, // 256MB
      estimatedDuration: 60000 // 1 minute
    };

    // Adjust based on data size
    switch (dataSize) {
      case 'xlarge':
        profile = {
          ...profile,
          recommendedBatchSize: 5000,
          recommendedChunkSize: 2000,
          recommendedParallelism: 4,
          memoryLimit: 1024 * 1024 * 1024, // 1GB
          estimatedDuration: 1800000 // 30 minutes
        };
        break;
      case 'large':
        profile = {
          ...profile,
          recommendedBatchSize: 2000,
          recommendedChunkSize: 1500,
          recommendedParallelism: 3,
          memoryLimit: 512 * 1024 * 1024, // 512MB
          estimatedDuration: 600000 // 10 minutes
        };
        break;
      case 'medium':
        profile = {
          ...profile,
          recommendedBatchSize: 1000,
          recommendedChunkSize: 1000,
          recommendedParallelism: 2,
          memoryLimit: 256 * 1024 * 1024, // 256MB
          estimatedDuration: 120000 // 2 minutes
        };
        break;
    }

    // Adjust based on operation type
    if (operationType === 'validation') {
      profile.recommendedBatchSize = Math.floor(profile.recommendedBatchSize * 0.5);
      profile.estimatedDuration = Math.floor(profile.estimatedDuration * 1.5);
    } else if (operationType === 'export') {
      profile.recommendedBatchSize = Math.floor(profile.recommendedBatchSize * 1.5);
      profile.estimatedDuration = Math.floor(profile.estimatedDuration * 0.8);
    }

    return profile;
  }, []);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);

  // Auto-generate suggestions periodically
  useEffect(() => {
    if (autoOptimize && metricsHistory.length > 5 && resourceHistory.length > 5) {
      generateOptimizationSuggestions(metricsHistory, resourceHistory);
    }
  }, [autoOptimize, metricsHistory, resourceHistory, generateOptimizationSuggestions]);

  return {
    // Current metrics
    currentMetrics,
    resourceUsage,
    
    // Historical data
    metricsHistory,
    resourceHistory,
    
    // Alerts and suggestions
    activeAlerts,
    optimizationSuggestions,
    
    // Performance profile
    currentProfile,
    
    // Control functions
    startMonitoring,
    stopMonitoring,
    recordOperation,
    acknowledgeAlert,
    applyOptimization,
    getOptimalSettings,
    
    // State
    isMonitoring,
    isLoading,
    error
  };
}