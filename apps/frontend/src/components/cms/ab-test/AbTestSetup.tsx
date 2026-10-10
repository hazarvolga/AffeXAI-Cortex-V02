'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
enum TestType {
  SUBJECT = 'subject',
  CONTENT = 'content',
  SEND_TIME = 'send_time',
  FROM_NAME = 'from_name',
  COMBINED = 'combined',
}

enum WinnerCriteria {
  OPEN_RATE = 'open_rate',
  CLICK_RATE = 'click_rate',
  CONVERSION_RATE = 'conversion_rate',
  REVENUE = 'revenue',
}

// Validation Schema
const variantSchema = z.object({
  label: z.string().min(1, 'Label is required').max(1, 'Label must be A-E'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Max 200 characters'),
  content: z.string().min(10, 'Content too short (min 10 chars)').max(10000, 'Content too long'),
  fromName: z.string().max(100).optional(),
  sendTimeOffset: z.number().min(0).max(168).optional(),
  splitPercentage: z.number().min(0).max(100),
});

const abTestSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
  testType: z.nativeEnum(TestType),
  winnerCriteria: z.nativeEnum(WinnerCriteria),
  autoSelectWinner: z.boolean(),
  testDuration: z.number().min(1).max(168),
  confidenceLevel: z.number().min(90).max(99.9),
  minSampleSize: z.number().min(50),
  variants: z.array(variantSchema).min(2, 'Minimum 2 variants').max(5, 'Maximum 5 variants'),
}).refine(
  (data) => {
    const totalSplit = data.variants.reduce((sum, v) => sum + v.splitPercentage, 0);
    return Math.abs(totalSplit - 100) < 0.01; // Allow tiny floating point errors
  },
  {
    message: 'Split percentages must sum to 100%',
    path: ['variants'],
  }
);

type AbTestFormData = z.infer<typeof abTestSchema>;

const VARIANT_LABELS = ['A', 'B', 'C', 'D', 'E'];
const VARIANT_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
];

interface AbTestSetupProps {
  campaignId: string;
  onSuccess?: (testId: string) => void;
}

export default function AbTestSetup({ campaignId, onSuccess }: AbTestSetupProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalSplit, setTotalSplit] = useState(100);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AbTestFormData>({
    resolver: zodResolver(abTestSchema),
    defaultValues: {
      campaignId,
      testType: TestType.SUBJECT,
      winnerCriteria: WinnerCriteria.OPEN_RATE,
      autoSelectWinner: true,
      testDuration: 24,
      confidenceLevel: 95,
      minSampleSize: 100,
      variants: [
        {
          label: 'A',
          subject: '',
          content: '',
          fromName: '',
          sendTimeOffset: 0,
          splitPercentage: 50,
        },
        {
          label: 'B',
          subject: '',
          content: '',
          fromName: '',
          sendTimeOffset: 0,
          splitPercentage: 50,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const variants = watch('variants');
  const testType = watch('testType');

  // Calculate total split percentage
  useEffect(() => {
    const total = variants.reduce((sum, v) => sum + (v.splitPercentage || 0), 0);
    setTotalSplit(total);
  }, [variants]);

  // Add variant
  const addVariant = () => {
    if (fields.length >= 5) {
      toast({
        variant: 'destructive',
        title: 'Maximum variants reached',
        description: 'You can have up to 5 variants (A-E)',
      });
      return;
    }

    const newLabel = VARIANT_LABELS[fields.length];
    const equalSplit = Math.floor(100 / (fields.length + 1));
    const remainder = 100 - equalSplit * (fields.length + 1);

    // Redistribute percentages equally
    variants.forEach((_, index) => {
      setValue(`variants.${index}.splitPercentage`, equalSplit);
    });

    append({
      label: newLabel,
      subject: '',
      content: '',
      fromName: '',
      sendTimeOffset: 0,
      splitPercentage: equalSplit + remainder, // Give remainder to new variant
    });
  };

  // Remove variant
  const removeVariant = (index: number) => {
    if (fields.length <= 2) {
      toast({
        variant: 'destructive',
        title: 'Minimum variants required',
        description: 'You need at least 2 variants for A/B testing',
      });
      return;
    }

    const removedPercentage = variants[index].splitPercentage;
    remove(index);

    // Redistribute removed percentage to remaining variants
    const newVariantCount = fields.length - 1;
    if (newVariantCount > 0) {
      const addPerVariant = Math.floor(removedPercentage / newVariantCount);
      const remainder = removedPercentage - addPerVariant * newVariantCount;

      variants.forEach((_, i) => {
        if (i !== index && i < newVariantCount) {
          const current = variants[i].splitPercentage;
          const extra = i === 0 ? remainder : 0; // Give remainder to first variant
          setValue(`variants.${i}.splitPercentage`, current + addPerVariant + extra);
        }
      });
    }
  };

  // Handle split percentage change
  const handleSplitChange = (index: number, value: number) => {
    const oldValue = variants[index].splitPercentage;
    const diff = value - oldValue;

    setValue(`variants.${index}.splitPercentage`, value);

    // Distribute difference among other variants
    const otherIndices = variants
      .map((_, i) => i)
      .filter((i) => i !== index);

    if (otherIndices.length > 0) {
      const adjustPerVariant = -diff / otherIndices.length;

      otherIndices.forEach((i) => {
        const newValue = Math.max(
          0,
          Math.min(100, variants[i].splitPercentage + adjustPerVariant)
        );
        setValue(`variants.${i}.splitPercentage`, parseFloat(newValue.toFixed(1)));
      });
    }
  };

  // Submit form
  const onSubmit = async (data: AbTestFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/email-marketing/ab-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create A/B test');
      }

      const result = await response.json();

      toast({
        title: 'A/B Test Created',
        description: `Successfully created test with ${data.variants.length} variants`,
      });

      if (onSuccess) {
        onSuccess(result.id);
      } else {
        router.push(`/dashboard/email-marketing/ab-test/${result.id}/results`);
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create A/B test',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>Configure your A/B test parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Type */}
          <div className="space-y-2">
            <Label htmlFor="testType">Test Type</Label>
            <Select
              value={testType}
              onValueChange={(value) => setValue('testType', value as TestType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TestType.SUBJECT}>Subject Line</SelectItem>
                <SelectItem value={TestType.CONTENT}>Email Content</SelectItem>
                <SelectItem value={TestType.SEND_TIME}>Send Time</SelectItem>
                <SelectItem value={TestType.FROM_NAME}>From Name</SelectItem>
                <SelectItem value={TestType.COMBINED}>Combined (Multiple Elements)</SelectItem>
              </SelectContent>
            </Select>
            {errors.testType && (
              <p className="text-sm text-destructive">{errors.testType.message}</p>
            )}
          </div>

          {/* Winner Criteria */}
          <div className="space-y-2">
            <Label htmlFor="winnerCriteria">Winner Criteria</Label>
            <Select
              value={watch('winnerCriteria')}
              onValueChange={(value) => setValue('winnerCriteria', value as WinnerCriteria)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WinnerCriteria.OPEN_RATE}>Open Rate</SelectItem>
                <SelectItem value={WinnerCriteria.CLICK_RATE}>Click Rate</SelectItem>
                <SelectItem value={WinnerCriteria.CONVERSION_RATE}>Conversion Rate</SelectItem>
                <SelectItem value={WinnerCriteria.REVENUE}>Revenue</SelectItem>
              </SelectContent>
            </Select>
            {errors.winnerCriteria && (
              <p className="text-sm text-destructive">{errors.winnerCriteria.message}</p>
            )}
          </div>

          {/* Grid: Duration, Confidence, Sample Size */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testDuration">Test Duration (hours)</Label>
              <Input
                id="testDuration"
                type="number"
                {...register('testDuration', { valueAsNumber: true })}
                min={1}
                max={168}
              />
              {errors.testDuration && (
                <p className="text-sm text-destructive">{errors.testDuration.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidenceLevel">Confidence Level (%)</Label>
              <Input
                id="confidenceLevel"
                type="number"
                {...register('confidenceLevel', { valueAsNumber: true })}
                min={90}
                max={99.9}
                step={0.1}
              />
              {errors.confidenceLevel && (
                <p className="text-sm text-destructive">{errors.confidenceLevel.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minSampleSize">Min Sample Size</Label>
              <Input
                id="minSampleSize"
                type="number"
                {...register('minSampleSize', { valueAsNumber: true })}
                min={50}
              />
              {errors.minSampleSize && (
                <p className="text-sm text-destructive">{errors.minSampleSize.message}</p>
              )}
            </div>
          </div>

          {/* Auto-Select Winner */}
          <div className="flex items-center space-x-2">
            <Switch
              id="autoSelectWinner"
              checked={watch('autoSelectWinner')}
              onCheckedChange={(checked) => setValue('autoSelectWinner', checked)}
            />
            <Label htmlFor="autoSelectWinner" className="cursor-pointer">
              Automatically select winner when test completes
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Variants</CardTitle>
            <CardDescription>
              Create {fields.length} variants (min 2, max 5)
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
            disabled={fields.length >= 5}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Split Percentage Visualization */}
          <div className="space-y-2">
            <Label>Traffic Distribution</Label>
            <div className="flex h-8 rounded-md overflow-hidden border">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className={`${VARIANT_COLORS[index]} flex items-center justify-center text-white text-sm font-medium transition-all`}
                  style={{ width: `${variants[index].splitPercentage}%` }}
                >
                  {variants[index].splitPercentage > 10 &&
                    `${variants[index].label}: ${variants[index].splitPercentage.toFixed(1)}%`}
                </div>
              ))}
            </div>
            {Math.abs(totalSplit - 100) > 0.01 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Total split is {totalSplit.toFixed(1)}%. Must equal 100%.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Variant Forms */}
          {fields.map((field, index) => (
            <Card key={field.id} className="border-l-4" style={{ borderLeftColor: VARIANT_COLORS[index].replace('bg-', '') }}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Badge className={VARIANT_COLORS[index]}>Variant {variants[index].label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {variants[index].splitPercentage.toFixed(1)}% of traffic
                  </span>
                </div>
                {fields.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor={`variants.${index}.subject`}>Subject Line</Label>
                  <Input
                    id={`variants.${index}.subject`}
                    {...register(`variants.${index}.subject`)}
                    placeholder="Enter subject line"
                  />
                  {errors.variants?.[index]?.subject && (
                    <p className="text-sm text-destructive">
                      {errors.variants[index]?.subject?.message}
                    </p>
                  )}
                </div>

                {/* Content (if applicable) */}
                {(testType === TestType.CONTENT || testType === TestType.COMBINED) && (
                  <div className="space-y-2">
                    <Label htmlFor={`variants.${index}.content`}>Email Content</Label>
                    <Textarea
                      id={`variants.${index}.content`}
                      {...register(`variants.${index}.content`)}
                      placeholder="Enter email content"
                      rows={6}
                    />
                    {errors.variants?.[index]?.content && (
                      <p className="text-sm text-destructive">
                        {errors.variants[index]?.content?.message}
                      </p>
                    )}
                  </div>
                )}

                {/* From Name (if applicable) */}
                {(testType === TestType.FROM_NAME || testType === TestType.COMBINED) && (
                  <div className="space-y-2">
                    <Label htmlFor={`variants.${index}.fromName`}>From Name (Optional)</Label>
                    <Input
                      id={`variants.${index}.fromName`}
                      {...register(`variants.${index}.fromName`)}
                      placeholder="e.g., John Doe"
                    />
                  </div>
                )}

                {/* Send Time Offset (if applicable) */}
                {(testType === TestType.SEND_TIME || testType === TestType.COMBINED) && (
                  <div className="space-y-2">
                    <Label htmlFor={`variants.${index}.sendTimeOffset`}>
                      Send Time Offset (hours from base)
                    </Label>
                    <Input
                      id={`variants.${index}.sendTimeOffset`}
                      type="number"
                      {...register(`variants.${index}.sendTimeOffset`, { valueAsNumber: true })}
                      min={0}
                      max={168}
                    />
                  </div>
                )}

                {/* Split Percentage Slider */}
                <div className="space-y-2">
                  <Label>Traffic Split: {variants[index].splitPercentage.toFixed(1)}%</Label>
                  <Slider
                    value={[variants[index].splitPercentage]}
                    onValueChange={(value) => handleSplitChange(index, value[0])}
                    min={0}
                    max={100}
                    step={0.1}
                    className="py-4"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The test will run for {watch('testDuration')} hours and automatically select a winner
          if confidence level reaches {watch('confidenceLevel')}% with at least{' '}
          {watch('minSampleSize')} samples per variant.
        </AlertDescription>
      </Alert>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || Math.abs(totalSplit - 100) > 0.01}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create A/B Test
        </Button>
      </div>
    </form>
  );
}
