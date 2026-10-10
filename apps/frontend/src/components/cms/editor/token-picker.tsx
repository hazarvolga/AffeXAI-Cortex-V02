/**
 * TokenPicker Component
 *
 * Visual token selection UI for CMS blocks
 * Allows users to select design tokens or enter custom values
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useDesignTokens } from '@/providers/DesignTokensProvider';
import type { DesignTokens, DesignToken } from '@/types/design-tokens';
import { isTokenAlias as isTemplateTokenAlias, extractTokenPath, createTokenAlias } from '@/types/cms-template';
import { getTokenValue } from '@/lib/cms/token-resolver';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Palette, Ruler, Type, Sparkles } from 'lucide-react';

/**
 * Token category type for filtering
 */
export type TokenCategory = 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'dimension' | 'fontFamily' | 'fontWeight';

/**
 * Extracted token information for display
 */
interface TokenInfo {
  path: string;
  label: string;
  value: any;
  category: string;
  description?: string;
}

/**
 * TokenPicker component props
 */
export interface TokenPickerProps {
  /**
   * Token category to filter available tokens
   */
  category: TokenCategory;

  /**
   * Current value (can be token alias or direct value)
   */
  value: string;

  /**
   * Callback when value changes
   */
  onChange: (value: string) => void;

  /**
   * Allow custom values in addition to token references
   */
  allowCustom?: boolean;

  /**
   * Placeholder text for custom input
   */
  placeholder?: string;

  /**
   * Label for the picker
   */
  label?: string;

  /**
   * Help text shown below the picker
   */
  description?: string;

  /**
   * Disable the picker
   */
  disabled?: boolean;
}

/**
 * Extract tokens by category from design tokens object
 */
function extractTokensByCategory(
  tokens: DesignTokens,
  category: TokenCategory,
  prefix: string = ''
): TokenInfo[] {
  const results: TokenInfo[] = [];

  for (const [key, value] of Object.entries(tokens)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object') {
      // Check if this is a token with $type
      if ('$type' in value && value.$type === category) {
        results.push({
          path: currentPath,
          label: formatTokenLabel(currentPath),
          value: '$value' in value ? value.$value : value,
          category: value.$type as string,
          description: '$description' in value ? value.$description as string : undefined,
        });
      } else if ('$type' in value && category === 'color' && currentPath.startsWith('color.')) {
        // Special handling for color tokens
        results.push({
          path: currentPath,
          label: formatTokenLabel(currentPath),
          value: '$value' in value ? value.$value : value,
          category: 'color',
          description: '$description' in value ? value.$description as string : undefined,
        });
      } else if (currentPath === category || currentPath.startsWith(`${category}.`)) {
        // Category-based grouping (e.g., spacing.*, color.*)
        if ('$value' in value) {
          results.push({
            path: currentPath,
            label: formatTokenLabel(currentPath),
            value: value.$value,
            category: category,
            description: '$description' in value ? value.$description as string : undefined,
          });
        } else {
          // Recursively search nested objects
          results.push(...extractTokensByCategory(value as DesignTokens, category, currentPath));
        }
      }
    }
  }

  return results;
}

/**
 * Format token path into readable label
 */
function formatTokenLabel(path: string): string {
  const parts = path.split('.');
  const lastPart = parts[parts.length - 1];

  // Convert kebab-case or camelCase to Title Case
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Color Token Preview Component
 */
function ColorTokenPreview({ value }: { value: string }) {
  // HSL format: "222 47% 11%"
  const hslColor = value.includes(' ') ? `hsl(${value})` : value;

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-6 w-6 rounded border border-border shadow-sm"
        style={{ backgroundColor: hslColor }}
        title={value}
      />
      <span className="text-xs text-muted-foreground font-mono">{value}</span>
    </div>
  );
}

/**
 * Spacing Token Preview Component
 */
function SpacingTokenPreview({ value }: { value: string }) {
  const numericValue = parseInt(value);
  const width = Math.min(numericValue, 200); // Cap at 200px for display

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-6 bg-muted rounded">
        <div
          className="h-full bg-primary rounded"
          style={{ width: `${width}px` }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-mono">{value}</span>
    </div>
  );
}

/**
 * Typography Token Preview Component
 */
function TypographyTokenPreview({ value }: { value: any }) {
  if (typeof value === 'object') {
    return (
      <div className="text-xs text-muted-foreground space-y-1">
        {value.fontSize && <div>Size: {value.fontSize}</div>}
        {value.lineHeight && <div>Line Height: {value.lineHeight}</div>}
        {value.fontWeight && <div>Weight: {value.fontWeight}</div>}
      </div>
    );
  }

  return <span className="text-xs text-muted-foreground font-mono">{String(value)}</span>;
}

/**
 * Token Preview Component - Renders appropriate preview based on category
 */
function TokenPreview({ category, value }: { category: TokenCategory; value: any }) {
  if (!value) return null;

  switch (category) {
    case 'color':
      return <ColorTokenPreview value={value} />;
    case 'spacing':
    case 'dimension':
      return <SpacingTokenPreview value={value} />;
    case 'typography':
      return <TypographyTokenPreview value={value} />;
    default:
      return <span className="text-xs text-muted-foreground font-mono">{String(value)}</span>;
  }
}

/**
 * Get category icon
 */
function getCategoryIcon(category: TokenCategory) {
  switch (category) {
    case 'color':
      return <Palette className="h-4 w-4" />;
    case 'spacing':
    case 'dimension':
      return <Ruler className="h-4 w-4" />;
    case 'typography':
    case 'fontFamily':
    case 'fontWeight':
      return <Type className="h-4 w-4" />;
    default:
      return <Sparkles className="h-4 w-4" />;
  }
}

/**
 * Main TokenPicker Component
 */
export function TokenPicker({
  category,
  value,
  onChange,
  allowCustom = true,
  placeholder,
  label,
  description,
  disabled = false,
}: TokenPickerProps) {
  const { tokens, context, mode } = useDesignTokens();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'custom'>(
    isTemplateTokenAlias(value) ? 'tokens' : 'custom'
  );

  // Extract available tokens for this category
  const availableTokens = useMemo(() => {
    return extractTokensByCategory(tokens, category);
  }, [tokens, category]);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery) return availableTokens;

    const query = searchQuery.toLowerCase();
    return availableTokens.filter(
      token =>
        token.label.toLowerCase().includes(query) ||
        token.path.toLowerCase().includes(query)
    );
  }, [availableTokens, searchQuery]);

  // Get current token path if value is a token alias
  const currentTokenPath = isTemplateTokenAlias(value) ? extractTokenPath(value) : '';

  // Handle token selection
  const handleTokenSelect = (tokenPath: string) => {
    onChange(createTokenAlias(tokenPath));
  };

  // Handle custom value input
  const handleCustomValueChange = (customValue: string) => {
    onChange(customValue);
  };

  // Switch to tokens tab when selecting a token
  const handleTokenClick = (tokenPath: string) => {
    setActiveTab('tokens');
    handleTokenSelect(tokenPath);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            {getCategoryIcon(category)}
            {label}
          </Label>
          <Badge variant="outline" className="text-xs">
            {context} · {mode}
          </Badge>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Tabs: Tokens vs Custom */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tokens' | 'custom')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tokens" disabled={disabled}>
            Design Tokens ({availableTokens.length})
          </TabsTrigger>
          <TabsTrigger value="custom" disabled={disabled || !allowCustom}>
            Custom Value
          </TabsTrigger>
        </TabsList>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              disabled={disabled}
            />
          </div>

          {/* Token List */}
          <div className="max-h-64 overflow-y-auto rounded-md border">
            {filteredTokens.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No tokens found for "{searchQuery}"
              </div>
            ) : (
              <RadioGroup
                value={currentTokenPath}
                onValueChange={handleTokenSelect}
                disabled={disabled}
              >
                {filteredTokens.map((token) => (
                  <div
                    key={token.path}
                    className="flex items-start gap-3 border-b p-3 last:border-b-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleTokenClick(token.path)}
                  >
                    <RadioGroupItem
                      value={token.path}
                      id={`token-${token.path}`}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`token-${token.path}`}
                        className="font-medium cursor-pointer"
                      >
                        {token.label}
                      </Label>
                      <div className="text-xs text-muted-foreground font-mono">
                        {`{${token.path}}`}
                      </div>
                      {token.description && (
                        <p className="text-xs text-muted-foreground">{token.description}</p>
                      )}
                      <TokenPreview category={category} value={token.value} />
                    </div>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        </TabsContent>

        {/* Custom Value Tab */}
        <TabsContent value="custom" className="space-y-3">
          {allowCustom ? (
            <>
              <Input
                type={category === 'color' ? 'text' : 'text'}
                value={isTemplateTokenAlias(value) ? '' : value}
                onChange={(e) => handleCustomValueChange(e.target.value)}
                placeholder={placeholder || `Enter custom ${category} value`}
                disabled={disabled}
              />
              {category === 'color' && !isTemplateTokenAlias(value) && value && (
                <div className="p-3 rounded-md border">
                  <ColorTokenPreview value={value} />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                💡 Tip: Use design tokens for automatic theme support
              </p>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Custom values are not allowed for this property.
              Please select a design token.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Current Value Display */}
      {value && (
        <div className="rounded-md bg-muted p-3 text-xs">
          <div className="font-medium mb-1">Current Value:</div>
          <div className="font-mono text-muted-foreground">
            {isTemplateTokenAlias(value) ? (
              <span className="text-primary">{value}</span>
            ) : (
              <span>{value}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact TokenPicker for inline use
 */
export function CompactTokenPicker({
  category,
  value,
  onChange,
  allowCustom = true,
}: Omit<TokenPickerProps, 'label' | 'description'>) {
  const { tokens } = useDesignTokens();
  const availableTokens = useMemo(() => {
    return extractTokensByCategory(tokens, category);
  }, [tokens, category]);

  const currentTokenPath = isTemplateTokenAlias(value) ? extractTokenPath(value) : '';
  const isToken = isTemplateTokenAlias(value);

  return (
    <div className="flex gap-2">
      <select
        value={isToken ? currentTokenPath : '__custom__'}
        onChange={(e) => {
          if (e.target.value === '__custom__') {
            onChange('');
          } else {
            onChange(createTokenAlias(e.target.value));
          }
        }}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {allowCustom && <option value="__custom__">Custom Value</option>}
        {availableTokens.map((token) => (
          <option key={token.path} value={token.path}>
            {token.label} ({token.path})
          </option>
        ))}
      </select>

      {(!isToken || allowCustom) && (
        <Input
          type="text"
          value={isToken ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Custom ${category}`}
          className="w-32"
          disabled={isToken}
        />
      )}
    </div>
  );
}
