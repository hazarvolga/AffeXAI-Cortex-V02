'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  TrendingUp,
  Clock,
  Users,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface AutomationAnalyticsProps {
  automationId: string;
  className?: string;
}

// Mock data - in production, fetch from API
const mockOverviewStats = {
  totalExecutions: 1247,
  successRate: 87.5,
  avgCompletionTime: '2h 15m',
  activeSubscribers: 892,
  trend: {
    executions: +12.3,
    successRate: +2.1,
    completionTime: -8.5,
    subscribers: +5.7,
  },
};

const mockTimelineData = [
  { date: 'Jan 1', executions: 42, successful: 38, failed: 4 },
  { date: 'Jan 5', executions: 58, successful: 52, failed: 6 },
  { date: 'Jan 10', executions: 73, successful: 65, failed: 8 },
  { date: 'Jan 15', executions: 65, successful: 59, failed: 6 },
  { date: 'Jan 20', executions: 81, successful: 72, failed: 9 },
  { date: 'Jan 25', executions: 95, successful: 84, failed: 11 },
  { date: 'Jan 30', executions: 108, successful: 96, failed: 12 },
];

const mockStepPerformance = [
  {
    stepName: 'Welcome Email',
    type: 'email',
    sent: 1247,
    opened: 892,
    clicked: 456,
    openRate: 71.5,
    clickRate: 36.6,
    status: 'active',
  },
  {
    stepName: 'Wait 2 Days',
    type: 'delay',
    entered: 1247,
    completed: 1180,
    completionRate: 94.6,
    avgWaitTime: '2d 3h',
    status: 'active',
  },
  {
    stepName: 'Check Engagement',
    type: 'condition',
    entered: 1180,
    trueBranch: 456,
    falseBranch: 724,
    truePercent: 38.6,
    falsePercent: 61.4,
    status: 'active',
  },
  {
    stepName: 'Follow-up Email',
    type: 'email',
    sent: 724,
    opened: 512,
    clicked: 203,
    openRate: 70.7,
    clickRate: 28.0,
    status: 'active',
  },
];

export function AutomationAnalytics({
  automationId,
  className,
}: AutomationAnalyticsProps) {
  const [dateRange, setDateRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    // Export analytics data as CSV
    console.log('Exporting analytics for automation:', automationId);
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  };

  const getTrendColor = (trend: number, inverse = false) => {
    if (inverse) {
      return trend < 0 ? 'text-green-600' : trend > 0 ? 'text-red-600' : 'text-gray-600';
    }
    return trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your automation performance and subscriber engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Executions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockOverviewStats.totalExecutions.toLocaleString()}
            </div>
            <p className={cn('text-xs', getTrendColor(mockOverviewStats.trend.executions))}>
              {getTrendIcon(mockOverviewStats.trend.executions)}{' '}
              {Math.abs(mockOverviewStats.trend.executions)}% from last period
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockOverviewStats.successRate}%</div>
            <p className={cn('text-xs', getTrendColor(mockOverviewStats.trend.successRate))}>
              {getTrendIcon(mockOverviewStats.trend.successRate)}{' '}
              {Math.abs(mockOverviewStats.trend.successRate)}% from last period
            </p>
          </CardContent>
        </Card>

        {/* Avg Completion Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockOverviewStats.avgCompletionTime}</div>
            <p className={cn('text-xs', getTrendColor(mockOverviewStats.trend.completionTime, true))}>
              {getTrendIcon(mockOverviewStats.trend.completionTime)}{' '}
              {Math.abs(mockOverviewStats.trend.completionTime)}% from last period
            </p>
          </CardContent>
        </Card>

        {/* Active Subscribers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockOverviewStats.activeSubscribers.toLocaleString()}
            </div>
            <p className={cn('text-xs', getTrendColor(mockOverviewStats.trend.subscribers))}>
              {getTrendIcon(mockOverviewStats.trend.subscribers)}{' '}
              {Math.abs(mockOverviewStats.trend.subscribers)}% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Timeline</CardTitle>
          <CardDescription>
            Daily automation executions over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockTimelineData}>
              <defs>
                <linearGradient id="colorExecutions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSuccessful" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="executions"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorExecutions)"
                name="Total Executions"
              />
              <Area
                type="monotone"
                dataKey="successful"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorSuccessful)"
                name="Successful"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Step Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Step Performance</CardTitle>
          <CardDescription>
            Detailed metrics for each step in your automation workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Step Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Metrics</TableHead>
                <TableHead className="text-right">Performance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStepPerformance.map((step, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{step.stepName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {step.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {step.type === 'email' && (
                      <div className="space-y-1">
                        <div>Sent: {step.sent?.toLocaleString()}</div>
                        <div>Opened: {step.opened?.toLocaleString()}</div>
                        <div>Clicked: {step.clicked?.toLocaleString()}</div>
                      </div>
                    )}
                    {step.type === 'delay' && (
                      <div className="space-y-1">
                        <div>Entered: {step.entered?.toLocaleString()}</div>
                        <div>Completed: {step.completed?.toLocaleString()}</div>
                        <div>Avg: {step.avgWaitTime}</div>
                      </div>
                    )}
                    {step.type === 'condition' && (
                      <div className="space-y-1">
                        <div>Entered: {step.entered?.toLocaleString()}</div>
                        <div>True: {step.trueBranch?.toLocaleString()}</div>
                        <div>False: {step.falseBranch?.toLocaleString()}</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {step.type === 'email' && (
                      <div className="space-y-1">
                        <div className="text-green-600 font-medium">
                          Open: {step.openRate}%
                        </div>
                        <div className="text-blue-600 font-medium">
                          Click: {step.clickRate}%
                        </div>
                      </div>
                    )}
                    {step.type === 'delay' && (
                      <div className="text-green-600 font-medium">
                        {step.completionRate}%
                      </div>
                    )}
                    {step.type === 'condition' && (
                      <div className="space-y-1">
                        <div className="text-green-600 font-medium">
                          True: {step.truePercent}%
                        </div>
                        <div className="text-amber-600 font-medium">
                          False: {step.falsePercent}%
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={step.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {step.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Subscriber journey through automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Started Workflow</span>
                <span className="font-medium">1,247 (100%)</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Opened First Email</span>
                <span className="font-medium">892 (71.5%)</span>
              </div>
              <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '71.5%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Clicked Link</span>
                <span className="font-medium">456 (36.6%)</span>
              </div>
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '36.6%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Completed Workflow</span>
                <span className="font-medium">203 (16.3%)</span>
              </div>
              <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '16.3%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Times */}
        <Card>
          <CardHeader>
            <CardTitle>Best Send Times</CardTitle>
            <CardDescription>When subscribers are most engaged</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Tuesday, 10:00 AM</span>
              <Badge variant="default">73% open rate</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Thursday, 2:00 PM</span>
              <Badge variant="default">71% open rate</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Wednesday, 9:00 AM</span>
              <Badge variant="default">69% open rate</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Monday, 11:00 AM</span>
              <Badge variant="secondary">65% open rate</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
