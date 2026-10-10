'use client';

import * as React from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FloatingInputProps extends InputProps {
  label: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || `floating-input-${label.toLowerCase().replace(/\s/g, '-')}`;
    
    return (
      <div className="relative">
        <Input
          ref={ref}
          id={inputId}
          className={cn(
            'peer placeholder-transparent',
            className
          )}
          placeholder={label}
          {...props}
        />
        <Label
          htmlFor={inputId}
          className={cn(
            'absolute left-2 -top-2.5 bg-background px-1 text-xs font-medium text-muted-foreground',
            'transition-all duration-200 ease-in-out',
            'peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground',
            'peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary',
            'peer-disabled:opacity-50'
          )}
        >
          {label}
        </Label>
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
