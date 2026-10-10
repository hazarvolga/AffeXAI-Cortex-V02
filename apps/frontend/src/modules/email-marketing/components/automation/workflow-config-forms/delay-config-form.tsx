'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DelayConfigData = {
  duration?: number;
  unit?: 'minutes' | 'hours' | 'days';
  configured: boolean;
};

interface DelayConfigFormProps {
  data: DelayConfigData;
  onUpdate: (data: DelayConfigData) => void;
  className?: string;
}

export function DelayConfigForm({
  data,
  onUpdate,
  className,
}: DelayConfigFormProps) {
  const [formData, setFormData] = useState<DelayConfigData>(data);

  // Update parent whenever form changes
  useEffect(() => {
    const isConfigured = !!(formData.duration && formData.unit && formData.duration > 0);
    onUpdate({ ...formData, configured: isConfigured });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]); // Only depend on formData, not onUpdate

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, duration: value > 0 ? value : undefined }));
  };

  const handleUnitChange = (unit: 'minutes' | 'hours' | 'days') => {
    setFormData((prev) => ({ ...prev, unit }));
  };

  const getDurationDisplay = () => {
    if (!formData.duration || !formData.unit) return 'Not configured';
    
    const duration = formData.duration;
    const unit = formData.unit;
    
    // Convert to human-readable format
    if (unit === 'minutes') {
      if (duration >= 60) {
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `${duration} minute${duration > 1 ? 's' : ''}`;
    }
    
    if (unit === 'hours') {
      if (duration >= 24) {
        const days = Math.floor(duration / 24);
        const hrs = duration % 24;
        return hrs > 0 ? `${days}d ${hrs}h` : `${days} day${days > 1 ? 's' : ''}`;
      }
      return `${duration} hour${duration > 1 ? 's' : ''}`;
    }
    
    return `${duration} day${duration > 1 ? 's' : ''}`;
  };

  const getMinMaxForUnit = () => {
    switch (formData.unit) {
      case 'minutes':
        return { min: 1, max: 1440, step: 1 }; // Max 24 hours in minutes
      case 'hours':
        return { min: 1, max: 720, step: 1 }; // Max 30 days in hours
      case 'days':
        return { min: 1, max: 365, step: 1 }; // Max 1 year
      default:
        return { min: 1, max: 100, step: 1 };
    }
  };

  const { min, max, step } = getMinMaxForUnit();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Duration Input */}
      <div className="space-y-2">
        <Label htmlFor="duration" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Wait Duration
          <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="duration"
            type="number"
            placeholder="Enter number"
            value={formData.duration || ''}
            onChange={handleDurationChange}
            min={min}
            max={max}
            step={step}
            className="flex-1"
          />
          <Select
            value={formData.unit}
            onValueChange={handleUnitChange}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.unit && (
          <p className="text-xs text-muted-foreground">
            Valid range: {min} - {max} {formData.unit}
          </p>
        )}
      </div>

      <Separator />

      {/* Duration Display */}
      <div className="rounded-lg bg-muted p-4">
        <Label className="text-sm font-medium mb-2 block">Wait Time</Label>
        <p className="text-2xl font-bold text-primary">
          {getDurationDisplay()}
        </p>
      </div>

      <Separator />

      {/* Info Section */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 border border-blue-200 dark:border-blue-900 flex gap-2">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <p className="font-medium">About Wait Step:</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-500">
            <li>Workflow execution pauses for the specified duration</li>
            <li>Subscribers continue to next step after delay</li>
            <li>Useful for drip campaigns and follow-ups</li>
          </ul>
        </div>
      </div>

      {/* Configuration Status */}
      {formData.duration && formData.unit ? (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 border border-green-200 dark:border-green-900">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            ✓ Configuration complete
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            ⚠ Please enter a duration and select a time unit
          </p>
        </div>
      )}
    </div>
  );
}
