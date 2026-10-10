import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EditableText } from '@/components/cms/editor/editable-text';
import { usePreview } from '@/components/cms/preview-context';
import { useLinkClickTracking } from '@/hooks/use-cms-tracking';

interface ButtonComponentProps {
  id: string;
  text: string;
  href?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export const ButtonComponent: React.FC<ButtonComponentProps> = ({
  id,
  text,
  href,
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
  onClick,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  borderRadius = 'md',
}) => {
  // Use preview context instead of editor context
  const previewContext = usePreview();
  const isEditMode = previewContext?.isEditMode || false;
  // In live mode, we don't need to update component props
  const updateComponentProps = () => {};

  // Track link clicks
  const trackLinkClick = useLinkClickTracking();

  const getBorderRadiusClass = () => {
    switch (borderRadius) {
      case 'none': return 'rounded-none';
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'full': return 'rounded-full';
      default: return '';
    }
  };

  const buttonClasses = cn(
    getBorderRadiusClass(),
    fullWidth && 'w-full',
    className
  );

  const handleTextChange = (newText: string) => {
    updateComponentProps();
  };

  const renderButtonContent = () => {
    if (isEditMode) {
      return (
        <>
          {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
          <EditableText
            value={text}
            onChange={handleTextChange}
            className="inline-block"
          />
          {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </>
      );
    }
    
    return (
      <>
        {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
        {text}
        {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
      </>
    );
  };

  if (href) {
    const handleLinkClick = () => {
      if (!isEditMode) {
        trackLinkClick(href, text);
      }
    };

    return (
      <a
        id={id}
        href={href}
        className={buttonClasses}
        onClick={handleLinkClick}
      >
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          className="w-full"
        >
          {renderButtonContent()}
        </Button>
      </a>
    );
  }

  return (
    <Button
      id={id}
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={onClick}
      className={buttonClasses}
    >
      {renderButtonContent()}
    </Button>
  );
};

export default ButtonComponent;