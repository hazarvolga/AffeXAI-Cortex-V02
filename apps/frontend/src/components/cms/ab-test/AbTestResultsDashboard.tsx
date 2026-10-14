"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/api-fetch";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Trophy,
  Clock,
  Users,
} from "lucide-react";
import { useAsyncEffect } from "@/hooks/use-async-effect";

// Types
interface Variant {
  id: string;
  label: string;
  subject: string;
  content?: string;
  fromName?: string;
  sendTimeOffset?: number;
  splitPercentage: number;
  status: "draft" | "testing" | "winner" | "loser";
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  conversionCount: number;
  revenue: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

interface StatisticalResult {
  pValue: number;
  chiSquare: number;
  confidenceLevel: number;
  isSignificant: boolean;
  sampleSizes: number[];
  successRates: number[];
}

interface ConfidenceInterval {
  variantId: string;
  variantLabel: string;
  rate: number;
  lower: number;
  upper: number;
  margin: number;
  sampleSize: number;
}

interface AbTestResults {
  campaign: {
    id: string;
    name: string;
    testType: string;
    winnerCriteria: string;
    autoSelectWinner: boolean;
    testDuration: number;
    confidenceLevel: number;
    minSampleSize: number;
    testStatus: "draft" | "testing" | "completed" | "cancelled";
    selectedWinnerId?: string;
    winnerSelectionDate?: string;
    createdAt: string;
  };
  variants: Variant[];
  statistics: StatisticalResult;
  confidenceIntervals: ConfidenceInterval[];
  canDeclareWinner: boolean;
  recommendedWinner?: string;
}

const VARIANT_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f97316", "#ec4899"];

const TEST_TYPE_LABELS: Record<string, string> = {
  subject: "Subject Line",
  content: "Email Content",
  send_time: "Send Time",
  from_name: "From Name",
  combined: "Combined Test",
};

const WINNER_CRITERIA_LABELS: Record<string, string> = {
  open_rate: "Open Rate",
  click_rate: "Click Rate",
  conversion_rate: "Conversion Rate",
  revenue: "Revenue",
};

interface AbTestResultsDashboardProps {
  campaignId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export default function AbTestResultsDashboard({
  campaignId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: AbTestResultsDashboardProps) {
  const router = useRouter();
  const [results, setResults] = useState<AbTestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [selectedWinnerVariantId, setSelectedWinnerVariantId] = useState<
    string | null
  >(null);
  const [isSelectingWinner, setIsSelectingWinner] = useState(false);

  // Fetch results
  const fetchResults = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await apiFetch(
        `/api/email-marketing/ab-test/${campaignId}/results`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch A/B test results");
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load A/B test results",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useAsyncEffect(() => {
    fetchResults();
  }, [campaignId]);

  // Auto-refresh for active tests
  useEffect(() => {
    if (!autoRefresh || !results || results.campaign.testStatus !== "testing") {
      return;
    }

    const interval = setInterval(() => {
      fetchResults(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, results?.campaign.testStatus]);

  // Select winner
  const handleSelectWinner = async () => {
    if (!selectedWinnerVariantId) return;

    setIsSelectingWinner(true);

    try {
      const response = await apiFetch(
        `/api/email-marketing/ab-test/${campaignId}/select-winner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ variantId: selectedWinnerVariantId }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to select winner");
      }

      toast({
        title: "Winner Selected",
        description: "The winning variant has been applied to the campaign",
      });

      setShowWinnerDialog(false);
      fetchResults();
    } catch (error) {
      console.error("Error selecting winner:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to select winner",
      });
    } finally {
      setIsSelectingWinner(false);
    }
  };

  // Export results
  const handleExport = () => {
    if (!results) return;

    const csvData = [
      [
        "Variant",
        "Subject",
        "Sent",
        "Opened",
        "Clicked",
        "Converted",
        "Revenue",
        "Open Rate",
        "Click Rate",
        "Conversion Rate",
      ],
      ...results.variants.map((v) => [
        v.label,
        v.subject,
        v.sentCount,
        v.openedCount,
        v.clickedCount,
        v.conversionCount,
        v.revenue,
        `${(v.openRate * 100).toFixed(2)}%`,
        `${(v.clickRate * 100).toFixed(2)}%`,
        `${(v.conversionRate * 100).toFixed(2)}%`,
      ]),
    ];

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ab-test-results-${campaignId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!results) return null;

    const createdAt = new Date(results.campaign.createdAt);
    const endTime = new Date(
      createdAt.getTime() + results.campaign.testDuration * 60 * 60 * 1000,
    );
    const now = new Date();
    const remaining = endTime.getTime() - now.getTime();

    if (remaining <= 0) return "Completed";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  // Prepare chart data
  const getChartData = () => {
    if (!results) return [];

    return results.variants.map((v, index) => ({
      name: `Variant ${v.label}`,
      openRate: (v.openRate * 100).toFixed(2),
      clickRate: (v.clickRate * 100).toFixed(2),
      conversionRate: (v.conversionRate * 100).toFixed(2),
      color: VARIANT_COLORS[index],
    }));
  };

  // Prepare confidence interval data
  const getConfidenceIntervalData = () => {
    if (!results) return [];

    return results.confidenceIntervals.map((ci, index) => ({
      name: `Variant ${ci.variantLabel}`,
      rate: ci.rate * 100,
      lower: ci.lower * 100,
      upper: ci.upper * 100,
      color: VARIANT_COLORS[index],
    }));
  };

  // Prepare pie chart data
  const getPieChartData = () => {
    if (!results) return [];

    return results.variants.map((v, index) => ({
      name: `Variant ${v.label}`,
      value: v.splitPercentage,
      color: VARIANT_COLORS[index],
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load A/B test results</AlertDescription>
      </Alert>
    );
  }

  const winner = results.variants.find(
    (v) => v.id === results.campaign.selectedWinnerId,
  );
  const timeRemaining = getTimeRemaining();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {results.campaign.name}
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-4">
                <span>
                  {TEST_TYPE_LABELS[results.campaign.testType]} |{" "}
                  {WINNER_CRITERIA_LABELS[results.campaign.winnerCriteria]}
                </span>
                <Badge
                  variant={
                    results.campaign.testStatus === "completed"
                      ? "default"
                      : results.campaign.testStatus === "testing"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {results.campaign.testStatus.toUpperCase()}
                </Badge>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchResults(true)}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <p className="text-lg font-semibold">{timeRemaining}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-lg font-semibold">
                  {results.variants
                    .reduce((sum, v) => sum + v.sentCount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Confidence Level
                </p>
                <p className="text-lg font-semibold">
                  {results.campaign.confidenceLevel}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Winner</p>
                <p className="text-lg font-semibold">
                  {winner ? `Variant ${winner.label}` : "Not Selected"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistical Significance */}
      {results.statistics && (
        <Alert
          variant={results.statistics.isSignificant ? "default" : "destructive"}
        >
          {results.statistics.isSignificant ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>
            {results.statistics.isSignificant ? (
              <>
                <strong>Statistically Significant!</strong> Chi-square:{" "}
                {results.statistics.chiSquare.toFixed(2)}, p-value:{" "}
                {results.statistics.pValue.toFixed(4)} (threshold:{" "}
                {(1 - results.campaign.confidenceLevel / 100).toFixed(4)})
              </>
            ) : (
              <>
                <strong>Not Statistically Significant</strong> - Chi-square:{" "}
                {results.statistics.chiSquare.toFixed(2)}, p-value:{" "}
                {results.statistics.pValue.toFixed(4)} (needs &lt;{" "}
                {(1 - results.campaign.confidenceLevel / 100).toFixed(4)})
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Variant Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.variants.map((variant, index) => {
          const isWinner = variant.id === results.campaign.selectedWinnerId;
          const isLoser = variant.status === "loser";

          return (
            <Card
              key={variant.id}
              className={`border-l-4 ${isWinner ? "border-l-green-500" : isLoser ? "border-l-red-500" : ""}`}
              style={{
                borderLeftColor: isWinner
                  ? undefined
                  : isLoser
                    ? undefined
                    : VARIANT_COLORS[index],
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge style={{ backgroundColor: VARIANT_COLORS[index] }}>
                    Variant {variant.label}
                  </Badge>
                  {isWinner && (
                    <Badge variant="default" className="bg-green-500">
                      <Trophy className="h-3 w-3 mr-1" />
                      Winner
                    </Badge>
                  )}
                  {isLoser && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Loser
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base mt-2">
                  {variant.subject}
                </CardTitle>
                <CardDescription>
                  {variant.splitPercentage}% traffic split
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Counts */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sent</p>
                    <p className="font-semibold">
                      {variant.sentCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Opened</p>
                    <p className="font-semibold">
                      {variant.openedCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Clicked</p>
                    <p className="font-semibold">
                      {variant.clickedCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Converted</p>
                    <p className="font-semibold">
                      {variant.conversionCount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Rates */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Open Rate</span>
                      <span className="font-semibold">
                        {(variant.openRate * 100).toFixed(2)}%
                      </span>
                    </div>
                    <Progress value={variant.openRate * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Click Rate</span>
                      <span className="font-semibold">
                        {(variant.clickRate * 100).toFixed(2)}%
                      </span>
                    </div>
                    <Progress value={variant.clickRate * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Conversion Rate</span>
                      <span className="font-semibold">
                        {(variant.conversionRate * 100).toFixed(2)}%
                      </span>
                    </div>
                    <Progress
                      value={variant.conversionRate * 100}
                      className="h-2"
                    />
                  </div>
                </div>

                {/* Sample Size Check */}
                {variant.sentCount < results.campaign.minSampleSize && (
                  <Alert variant="destructive" className="py-2">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Need {results.campaign.minSampleSize - variant.sentCount}{" "}
                      more samples
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="openRate" fill="#3b82f6" name="Open Rate %" />
                <Bar dataKey="clickRate" fill="#10b981" name="Click Rate %" />
                <Bar
                  dataKey="conversionRate"
                  fill="#8b5cf6"
                  name="Conversion Rate %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Intervals */}
        <Card>
          <CardHeader>
            <CardTitle>
              Confidence Intervals ({results.campaign.confidenceLevel}%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getConfidenceIntervalData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#3b82f6"
                  name="Rate %"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="lower"
                  stroke="#ef4444"
                  name="Lower Bound"
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="upper"
                  stroke="#10b981"
                  name="Upper Bound"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getPieChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sample Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Size Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.variants.map((variant, index) => (
              <div key={variant.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>Variant {variant.label}</span>
                  <span className="font-semibold">
                    {variant.sentCount} / {results.campaign.minSampleSize}
                  </span>
                </div>
                <Progress
                  value={
                    (variant.sentCount / results.campaign.minSampleSize) * 100
                  }
                  className="h-2"
                  style={{
                    // @ts-ignore
                    "--progress-background": VARIANT_COLORS[index],
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {results.campaign.testStatus === "testing" &&
        !results.campaign.selectedWinnerId &&
        results.canDeclareWinner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ready to Declare Winner
              </CardTitle>
              <CardDescription>
                The test has reached statistical significance. You can now
                select a winner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {results.variants.map((variant, index) => (
                  <Button
                    key={variant.id}
                    variant={
                      variant.id === results.recommendedWinner
                        ? "default"
                        : "outline"
                    }
                    onClick={() => {
                      setSelectedWinnerVariantId(variant.id);
                      setShowWinnerDialog(true);
                    }}
                  >
                    {variant.id === results.recommendedWinner && (
                      <Trophy className="h-4 w-4 mr-2" />
                    )}
                    Select Variant {variant.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Winner Dialog */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Winner Selection</DialogTitle>
            <DialogDescription>
              Are you sure you want to select this variant as the winner? This
              will update the campaign with the winning variant&apos;s content.
            </DialogDescription>
          </DialogHeader>
          {selectedWinnerVariantId && (
            <div className="py-4">
              {results.variants
                .filter((v) => v.id === selectedWinnerVariantId)
                .map((variant) => (
                  <Card key={variant.id}>
                    <CardHeader>
                      <Badge
                        style={{
                          backgroundColor:
                            VARIANT_COLORS[results.variants.indexOf(variant)],
                        }}
                      >
                        Variant {variant.label}
                      </Badge>
                      <CardTitle className="text-base mt-2">
                        {variant.subject}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>Open Rate: {(variant.openRate * 100).toFixed(2)}%</p>
                      <p>Click Rate: {(variant.clickRate * 100).toFixed(2)}%</p>
                      <p>
                        Conversion Rate:{" "}
                        {(variant.conversionRate * 100).toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWinnerDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSelectWinner} disabled={isSelectingWinner}>
              {isSelectingWinner && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Winner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
