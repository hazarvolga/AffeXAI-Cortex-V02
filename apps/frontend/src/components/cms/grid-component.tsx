'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GridComponentProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  columns?: number | 'auto' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  background?: 'none' | 'primary' | 'secondary' | 'muted';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

export const GridComponent: React.FC<GridComponentProps> = ({
  id,
  children,
  className,
  columns = 'auto',
  gap = 'md',
  padding = 'none',
  margin = 'none',
  background = 'none',
  rounded = 'none',
}) => {
  const getColumnsClass = () => {
    if (columns === 'auto') {
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
    
    switch (columns) {
      case '1': return 'grid-cols-1';
      case '2': return 'grid-cols-1 sm:grid-cols-2';
      case '3': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case '4': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case '5': return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
      case '6': return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getGapClass = () => {
    switch (gap) {
      case 'xs': return 'gap-1';
      case 'sm': return 'gap-2';
      case 'md': return 'gap-4';
      case 'lg': return 'gap-6';
      case 'xl': return 'gap-8';
      case '2xl': return 'gap-12';
      default: return '';
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case 'xs': return 'p-1';
      case 'sm': return 'p-2';
      case 'md': return 'p-4';
      case 'lg': return 'p-6';
      case 'xl': return 'p-8';
      case '2xl': return 'p-12';
      default: return '';
    }
  };

  const getMarginClass = () => {
    switch (margin) {
      case 'xs': return 'm-1';
      case 'sm': return 'm-2';
      case 'md': return 'm-4';
      case 'lg': return 'm-6';
      case 'xl': return 'm-8';
      case '2xl': return 'm-12';
      default: return '';
    }
  };

  const getBackgroundClass = () => {
    switch (background) {
      case 'primary': return 'bg-primary';
      case 'secondary': return 'bg-secondary';
      case 'muted': return 'bg-muted';
      default: return '';
    }
  };

  const getRoundedClass = () => {
    switch (rounded) {
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'xl': return 'rounded-xl';
      case '2xl': return 'rounded-2xl';
      case '3xl': return 'rounded-3xl';
      case 'full': return 'rounded-full';
      default: return '';
    }
  };

  const gridClasses = cn(
    'grid',
    getColumnsClass(),
    getGapClass(),
    getPaddingClass(),
    getMarginClass(),
    getBackgroundClass(),
    getRoundedClass(),
    className
  );

  return (
    <div id={id} className={gridClasses}>
      {children}
    </div>
  );
};

export default GridComponent;