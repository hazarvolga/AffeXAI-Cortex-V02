'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || `floating-textarea-${label.toLowerCase().replace(/\s/g, '-')}`;
    
    return (
      <div className="relative">
        <Textarea
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

FloatingTextarea.displayName = 'FloatingTextarea';

export { FloatingTextarea };
