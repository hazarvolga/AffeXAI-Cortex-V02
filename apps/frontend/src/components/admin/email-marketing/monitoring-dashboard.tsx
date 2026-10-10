'use client';

/**
 * Monitoring Dashboard Component
 * 
 * Comprehensive monitoring dashboard for bulk operations including:
 * - Real-time performance metrics
 * - System health indicators
 * - Alert management
 * - Audit trail visualization
 * - Compliance reporting
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Download,
  Eye,
  FileText,
  Monitor,
  Shield,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SystemMetrics {
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
}

interface BusinessMetrics {
  timestamp: Date;
  totalImportsToday: number;
  totalExportsToday: number;
  totalRecordsProcessed: number;
  averageValidationRate: number;
  averageProcessingTime: number;
  errorRate: number;
  activeUsers: number;
}

interface MetricAlert {
  id: string;
  timestamp: Date;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  resolvedAt?: Date;
}

interface MetricsSummary {
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

interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  userId: string;
  resource: string;
  action: string;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// Mock Data (In production, this would come from the metrics service)
// ============================================================================

const mockSystemMetrics: SystemMetrics = {
  timestamp: new Date(),
  memoryUsage: {
    used: 2147483648, // 2GB
    free: 2147483648, // 2GB
    total: 4294967296, // 4GB
    percentage: 50
  },
  cpuUsage: 35,
  activeConnections: 45,
  queueSize: 12
};

const mockBusinessMetrics: BusinessMetrics = {
  timestamp: new Date(),
  totalImportsToday: 15,
  totalExportsToday: 8,
  totalRecordsProcessed: 125000,
  averageValidationRate: 94.5,
  averageProcessingTime: 2500,
  errorRate: 2.1,
  activeUsers: 12
};

const mockAlerts: MetricAlert[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    message: 'Memory usage above 85% threshold',
    severity: 'high',
    acknowledged: false
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 900000), // 15 minutes ago
    message: 'Queue size exceeded 100 items',
    severity: 'medium',
    acknowledged: true
  }
];

const mockMetricsSummary: MetricsSummary = {
  timeRange: { 
    start: new Date(Date.now() - 24 * 60 * 60 * 1000), 
    end: new Date() 
  },
  totalOperations: 45,
  successfulOperations: 42,
  failedOperations: 3,
  averageThroughput: 1250.5,
  peakThroughput: 2800.0,
  averageMemoryUsage: 52.3,
  peakMemoryUsage: 78.9,
  totalErrorCount: 8,
  mostCommonErrors: [
    { type: 'VALIDATION_FAILED', count: 3 },
    { type: 'FILE_PROCESSING_ERROR', count: 2 },
    { type: 'NETWORK_TIMEOUT', count: 2 },
    { type: 'PERMISSION_DENIED', count: 1 }
  ],
  performanceTrends: {
    throughputTrend: 'improving',
    errorRateTrend: 'stable',
    memoryUsageTrend: 'declining'
  }
};

const mockAuditEvents: AuditEvent[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 600000),
    eventType: 'DATA_IMPORT_COMPLETED',
    userId: 'user123',
    resource: 'bulk_import',
    action: 'import_subscribers',
    success: true,
    riskLevel: 'medium'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1200000),
    eventType: 'DATA_EXPORT_STARTED',
    userId: 'user456',
    resource: 'bulk_export',
    action: 'export_subscribers',
    success: true,
    riskLevel: 'low'
  }
];

// ============================================================================
// Component Implementation
// ============================================================================

export default function MonitoringDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>(mockSystemMetrics);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>(mockBusinessMetrics);
  const [alerts, setAlerts] = useState<MetricAlert[]>(mockAlerts);
  const [metricsSummary, setMetricsSummary] = useState<MetricsSummary>(mockMetricsSummary);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(mockAuditEvents);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isLoading, setIsLoading] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update system metrics with slight variations
      setSystemMetrics(prev => ({
        ...prev,
        timestamp: new Date(),
        memoryUsage: {
          ...prev.memoryUsage,
          percentage: Math.max(30, Math.min(90, prev.memoryUsage.percentage + (Math.random() - 0.5) * 5))
        },
        cpuUsage: Math.max(10, Math.min(95, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        activeConnections: Math.max(5, Math.min(100, prev.activeConnections + Math.floor((Math.random() - 0.5) * 6))),
        queueSize: Math.max(0, Math.min(50, prev.queueSize + Math.floor((Math.random() - 0.5) * 4)))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleGenerateReport = async (reportType: string) => {
    setIsLoading(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    // In production, this would trigger actual report generation
    console.log(`Generating ${reportType} report...`);
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged && !alert.resolvedAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and analytics for bulk operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateReport('compliance')}
            disabled={isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert) => (
            <Alert key={alert.id} variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span>{alert.severity.toUpperCase()} Alert</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                >
                  Acknowledge
                </Button>
              </AlertTitle>
              <AlertDescription>
                {alert.message}
                <div className="text-xs text-muted-foreground mt-1">
                  {alert.timestamp.toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* System Health Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.memoryUsage.percentage.toFixed(1)}%</div>
                <Progress value={systemMetrics.memoryUsage.percentage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {formatBytes(systemMetrics.memoryUsage.used)} / {formatBytes(systemMetrics.memoryUsage.total)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.cpuUsage.toFixed(1)}%</div>
                <Progress value={systemMetrics.cpuUsage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Current load
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.queueSize}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Pending jobs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{businessMetrics.activeUsers}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Currently online
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Business Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Today's Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Imports</span>
                  <span className="font-medium">{businessMetrics.totalImportsToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Exports</span>
                  <span className="font-medium">{businessMetrics.totalExportsToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Records Processed</span>
                  <span className="font-medium">{businessMetrics.totalRecordsProcessed.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Validation Rate</span>
                  <span className="font-medium">{businessMetrics.averageValidationRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Rate</span>
                  <span className="font-medium">{businessMetrics.errorRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Processing Time</span>
                  <span className="font-medium">{formatDuration(businessMetrics.averageProcessingTime)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Performance Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Throughput</span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metricsSummary.performanceTrends.throughputTrend)}
                    <span className="text-sm">{metricsSummary.performanceTrends.throughputTrend}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Rate</span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metricsSummary.performanceTrends.errorRateTrend)}
                    <span className="text-sm">{metricsSummary.performanceTrends.errorRateTrend}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metricsSummary.performanceTrends.memoryUsageTrend)}
                    <span className="text-sm">{metricsSummary.performanceTrends.memoryUsageTrend}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>
                Last 24 hours performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Total Operations</p>
                  <p className="text-2xl font-bold">{metricsSummary.totalOperations}</p>
                  <p className="text-xs text-muted-foreground">
                    {metricsSummary.successfulOperations} successful, {metricsSummary.failedOperations} failed
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Average Throughput</p>
                  <p className="text-2xl font-bold">{metricsSummary.averageThroughput}</p>
                  <p className="text-xs text-muted-foreground">records/second</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Peak Throughput</p>
                  <p className="text-2xl font-bold">{metricsSummary.peakThroughput}</p>
                  <p className="text-xs text-muted-foreground">records/second</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Error Count</p>
                  <p className="text-2xl font-bold">{metricsSummary.totalErrorCount}</p>
                  <p className="text-xs text-muted-foreground">total errors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Common Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metricsSummary.mostCommonErrors.map((error, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{error.type.replace(/_/g, ' ')}</span>
                    <Badge variant="secondary">{error.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Events</CardTitle>
              <CardDescription>
                Latest audit trail entries for compliance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {event.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={getSeverityColor(event.riskLevel) as any}>
                          {event.riskLevel}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{event.eventType.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.userId} • {event.action} • {event.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Management</CardTitle>
              <CardDescription>
                Configure and manage system alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        alert.severity === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(alert.severity) as any}>
                        {alert.severity}
                      </Badge>
                      {alert.acknowledged ? (
                        <Badge variant="secondary">Acknowledged</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}