'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FloatingSelectProps {
  label: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  id?: string;
  placeholder?: string;
}

const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  value,
  onValueChange,
  disabled,
  children,
  id,
  placeholder,
}) => {
  const selectId = id || `floating-select-${label.toLowerCase().replace(/\s/g, '-')}`;
  const [isFocused, setIsFocused] = React.useState(false);
  const hasValue = value !== undefined && value !== '' && value !== null;
  
  return (
    <div className="relative">
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={selectId}
          className={cn(
            'peer',
            hasValue || isFocused ? 'pt-5 pb-1' : ''
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <SelectValue placeholder={placeholder || label} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      <Label
        htmlFor={selectId}
        className={cn(
          'absolute left-3 bg-background px-1 text-xs font-medium text-muted-foreground pointer-events-none',
          'transition-all duration-200 ease-in-out',
          hasValue || isFocused
            ? '-top-2.5 text-xs text-primary'
            : 'top-2.5 text-sm text-muted-foreground',
          disabled && 'opacity-50'
        )}
      >
        {label}
      </Label>
    </div>
  );
};

FloatingSelect.displayName = 'FloatingSelect';

export { FloatingSelect };
