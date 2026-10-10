'use client';

/**
 * A/B Test Manager Component
 *
 * Create and manage A/B tests for components:
 * - Create new tests with variants
 * - Monitor test progress
 * - View statistical significance
 * - Declare winners
 */

import { useState } from 'react';
import type { ABTest, ABTestVariant } from '@/types/cms-analytics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PlayIcon,
  PauseIcon,
  StopCircleIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
} from 'lucide-react';

export interface ABTestManagerProps {
  /** Existing tests */
  tests: ABTest[];

  /** On create test */
  onCreateTest?: (test: Partial<ABTest>) => void;

  /** On update test */
  onUpdateTest?: (testId: string, updates: Partial<ABTest>) => void;

  /** On delete test */
  onDeleteTest?: (testId: string) => void;

  /** On declare winner */
  onDeclareWinner?: (testId: string, variantId: string) => void;
}

export function ABTestManager({
  tests,
  onCreateTest,
  onUpdateTest,
  onDeleteTest,
  onDeclareWinner,
}: ABTestManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);

  const runningTests = tests.filter((t) => t.status === 'running');
  const completedTests = tests.filter((t) => t.status === 'completed');
  const draftTests = tests.filter((t) => t.status === 'draft');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">A/B Test Manager</h2>
          <p className="text-muted-foreground">
            Create and manage component experiments
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          Create New Test
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <PlayIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Running</div>
              <div className="text-2xl font-bold">{runningTests.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2Icon className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="text-2xl font-bold">{completedTests.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-500/10">
              <AlertCircleIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Drafts</div>
              <div className="text-2xl font-bold">{draftTests.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Running tests */}
      {runningTests.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Running Tests</h3>
          <div className="space-y-3">
            {runningTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onUpdate={(updates) => onUpdateTest?.(test.id, updates)}
                onDeclareWinner={(variantId) => onDeclareWinner?.(test.id, variantId)}
                onSelect={() => setSelectedTest(test)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed tests */}
      {completedTests.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Completed Tests</h3>
          <div className="space-y-3">
            {completedTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onSelect={() => setSelectedTest(test)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Draft tests */}
      {draftTests.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Draft Tests</h3>
          <div className="space-y-3">
            {draftTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onUpdate={(updates) => onUpdateTest?.(test.id, updates)}
                onDelete={() => onDeleteTest?.(test.id)}
                onSelect={() => setSelectedTest(test)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create test modal */}
      {isCreating && (
        <CreateTestModal
          onClose={() => setIsCreating(false)}
          onCreate={(test) => {
            onCreateTest?.(test);
            setIsCreating(false);
          }}
        />
      )}

      {/* Test details modal */}
      {selectedTest && (
        <TestDetailsModal
          test={selectedTest}
          onClose={() => setSelectedTest(null)}
          onUpdate={(updates) => {
            onUpdateTest?.(selectedTest.id, updates);
            setSelectedTest(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Test Card Component
 */
interface TestCardProps {
  test: ABTest;
  onUpdate?: (updates: Partial<ABTest>) => void;
  onDelete?: () => void;
  onDeclareWinner?: (variantId: string) => void;
  onSelect?: () => void;
}

function TestCard({ test, onUpdate, onDelete, onDeclareWinner, onSelect }: TestCardProps) {
  const winnerVariant = test.winnerVariantId
    ? test.variants.find((v) => v.id === test.winnerVariantId)
    : null;

  const bestPerformingVariant = [...test.variants].sort(
    (a, b) => b.metrics.conversionRate - a.metrics.conversionRate
  )[0];

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{test.name}</h4>
              <Badge variant={test.status === 'running' ? 'default' : 'secondary'}>
                {test.status}
              </Badge>
              {test.statisticalSignificance?.achieved && (
                <Badge variant="secondary">
                  <TrendingUpIcon className="h-3 w-3 mr-1" />
                  {test.statisticalSignificance.confidenceLevel}% confident
                </Badge>
              )}
            </div>
            {test.description && (
              <p className="text-sm text-muted-foreground">{test.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Goal: {test.conversionGoal}</span>
              <span>•</span>
              <span>
                {new Date(test.period.start).toLocaleDateString()}
                {test.period.end && ` - ${new Date(test.period.end).toLocaleDateString()}`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {test.status === 'running' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate?.({ status: 'paused' });
                }}
              >
                <PauseIcon className="h-4 w-4" />
              </Button>
            )}
            {test.status === 'paused' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate?.({ status: 'running' });
                }}
              >
                <PlayIcon className="h-4 w-4" />
              </Button>
            )}
            {test.status === 'draft' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Variants */}
        <div className="grid grid-cols-3 gap-3">
          {test.variants.map((variant) => (
            <div
              key={variant.id}
              className={`p-3 rounded-lg border ${
                variant.id === test.winnerVariantId
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : variant.id === bestPerformingVariant.id
                  ? 'border-primary'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{variant.name}</span>
                {variant.id === test.winnerVariantId && (
                  <Badge variant="default" className="bg-green-500">
                    Winner
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {(variant.metrics.conversionRate * 100).toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {variant.metrics.conversions} / {variant.metrics.impressions} conversions
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg engagement: {(variant.metrics.averageEngagementTime / 1000).toFixed(1)}s
                </div>
              </div>

              {test.status === 'running' && !test.winnerVariantId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeclareWinner?.(variant.id);
                  }}
                >
                  Declare Winner
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Statistical significance progress */}
        {test.statisticalSignificance && test.status === 'running' && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Statistical Confidence</span>
              <span className="text-sm font-medium">
                {test.statisticalSignificance.confidenceLevel}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  test.statisticalSignificance.achieved
                    ? 'bg-green-500'
                    : 'bg-primary'
                }`}
                style={{
                  width: `${test.statisticalSignificance.confidenceLevel}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Create Test Modal Component
 */
interface CreateTestModalProps {
  onClose: () => void;
  onCreate: (test: Partial<ABTest>) => void;
}

function CreateTestModal({ onClose, onCreate }: CreateTestModalProps) {
  const [testName, setTestName] = useState('');
  const [description, setDescription] = useState('');
  const [componentId, setComponentId] = useState('');
  const [conversionGoal, setConversionGoal] = useState('');
  const [variants, setVariants] = useState<Partial<ABTestVariant>[]>([
    { name: 'Control', trafficAllocation: 50 },
    { name: 'Variant A', trafficAllocation: 50 },
  ]);

  const handleSubmit = () => {
    onCreate({
      name: testName,
      description,
      componentId,
      conversionGoal,
      variants: variants as ABTestVariant[],
      status: 'draft',
      period: {
        start: new Date(),
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-xl font-bold mb-4">Create A/B Test</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="testName">Test Name</Label>
            <Input
              id="testName"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="E.g., Hero Button Color Test"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what you're testing"
            />
          </div>

          <div>
            <Label htmlFor="componentId">Component ID</Label>
            <Input
              id="componentId"
              value={componentId}
              onChange={(e) => setComponentId(e.target.value)}
              placeholder="Component to test"
            />
          </div>

          <div>
            <Label htmlFor="conversionGoal">Conversion Goal</Label>
            <Input
              id="conversionGoal"
              value={conversionGoal}
              onChange={(e) => setConversionGoal(e.target.value)}
              placeholder="E.g., Button Click, Form Submit"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              Create Test
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Test Details Modal Component
 */
interface TestDetailsModalProps {
  test: ABTest;
  onClose: () => void;
  onUpdate: (updates: Partial<ABTest>) => void;
}

function TestDetailsModal({ test, onClose, onUpdate }: TestDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">{test.name}</h3>
            {test.description && (
              <p className="text-muted-foreground">{test.description}</p>
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Detailed metrics and charts would go here */}
        <div className="space-y-6">
          {/* Variant comparison */}
          <div>
            <h4 className="font-semibold mb-3">Variant Performance</h4>
            <div className="grid grid-cols-2 gap-4">
              {test.variants.map((variant) => (
                <Card key={variant.id} className="p-4">
                  <h5 className="font-medium mb-3">{variant.name}</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                      <span className="font-semibold">
                        {(variant.metrics.conversionRate * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Impressions</span>
                      <span className="font-semibold">
                        {variant.metrics.impressions.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conversions</span>
                      <span className="font-semibold">
                        {variant.metrics.conversions.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Engagement</span>
                      <span className="font-semibold">
                        {(variant.metrics.averageEngagementTime / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
