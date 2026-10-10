'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { AnalyticsTimeRange } from '@/lib/api/cmsAnalyticsService';

interface TimeRangeFilterProps {
  timeRange: AnalyticsTimeRange;
  onTimeRangeChange: (range: AnalyticsTimeRange) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (start?: Date, end?: Date) => void;
}

const TIME_RANGE_OPTIONS = [
  { value: 'today', label: 'Bugün' },
  { value: 'yesterday', label: 'Dün' },
  { value: 'last7days', label: 'Son 7 Gün' },
  { value: 'last30days', label: 'Son 30 Gün' },
  { value: 'last90days', label: 'Son 90 Gün' },
  { value: 'custom', label: 'Özel Tarih Aralığı' },
] as const;

export function TimeRangeFilter({
  timeRange,
  onTimeRangeChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: TimeRangeFilterProps) {
  const isCustomRange = timeRange === 'custom';

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select value={timeRange} onValueChange={(value) => onTimeRangeChange(value as AnalyticsTimeRange)}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Zaman aralığı seç" />
        </SelectTrigger>
        <SelectContent>
          {TIME_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustomRange && onCustomDateChange && (
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[180px] justify-start text-left font-normal',
                  !customStartDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? (
                  format(customStartDate, 'PPP', { locale: tr })
                ) : (
                  <span>Başlangıç tarihi</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={(date) => onCustomDateChange(date, customEndDate)}
                initialFocus
                disabled={(date) =>
                  date > new Date() || (customEndDate ? date > customEndDate : false)
                }
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[180px] justify-start text-left font-normal',
                  !customEndDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? (
                  format(customEndDate, 'PPP', { locale: tr })
                ) : (
                  <span>Bitiş tarihi</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={(date) => onCustomDateChange(customStartDate, date)}
                initialFocus
                disabled={(date) =>
                  date > new Date() || (customStartDate ? date < customStartDate : false)
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
