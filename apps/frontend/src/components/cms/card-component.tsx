'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardComponentProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  background?: 'none' | 'primary' | 'secondary' | 'muted';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner';
  border?: boolean;
  borderColor?: 'default' | 'primary' | 'secondary';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const CardComponent: React.FC<CardComponentProps> = ({
  id,
  children,
  className,
  padding = 'md',
  background = 'none',
  rounded = 'lg',
  shadow = 'md',
  border = true,
  borderColor = 'default',
  hover = false,
  clickable = false,
  onClick,
}) => {
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

  const getBackgroundClass = () => {
    switch (background) {
      case 'primary': return 'bg-primary';
      case 'secondary': return 'bg-secondary';
      case 'muted': return 'bg-muted';
      default: return 'bg-card';
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

  const getShadowClass = () => {
    switch (shadow) {
      case 'sm': return 'shadow-sm';
      case 'md': return 'shadow';
      case 'lg': return 'shadow-lg';
      case 'xl': return 'shadow-xl';
      case '2xl': return 'shadow-2xl';
      case 'inner': return 'shadow-inner';
      default: return '';
    }
  };

  const getBorderClass = () => {
    if (!border) return '';
    
    switch (borderColor) {
      case 'primary': return 'border border-primary';
      case 'secondary': return 'border border-secondary';
      default: return 'border border-border';
    }
  };

  const cardClasses = cn(
    'transition-all duration-200',
    getPaddingClass(),
    getBackgroundClass(),
    getRoundedClass(),
    getShadowClass(),
    getBorderClass(),
    hover && 'hover:shadow-lg',
    clickable && 'cursor-pointer',
    className
  );

  return (
    <div
      id={id}
      className={cardClasses}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default CardComponent;