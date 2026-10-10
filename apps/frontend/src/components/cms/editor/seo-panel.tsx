'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, 
  Globe, 
  Twitter, 
  Search,
  Image as ImageIcon,
  Code,
  Layout
} from 'lucide-react';

interface SEOData {
  // Basic Meta Tags
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  
  // OpenGraph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  
  // Twitter Cards
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCreator?: string;
  
  // Robots
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  
  // Structured Data
  structuredData?: string;
}

interface SEOPanelProps {
  seoData: SEOData;
  onSEODataChange: (data: SEOData) => void;
  showHeader?: boolean;
  showFooter?: boolean;
  onShowHeaderChange?: (value: boolean) => void;
  onShowFooterChange?: (value: boolean) => void;
}

export const SEOPanel: React.FC<SEOPanelProps> = ({ 
  seoData, 
  onSEODataChange,
  showHeader = true,
  showFooter = true,
  onShowHeaderChange,
  onShowFooterChange
}) => {
  const handleChange = (field: keyof SEOData, value: any) => {
    onSEODataChange({
      ...seoData,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Layout Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            <CardTitle>Page Layout</CardTitle>
          </div>
          <CardDescription>
            Control the visibility of header and footer on this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showHeader">Show Header</Label>
              <p className="text-sm text-muted-foreground">
                Display the site header on this page
              </p>
            </div>
            <Switch
              id="showHeader"
              checked={showHeader}
              onCheckedChange={onShowHeaderChange}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showFooter">Show Footer</Label>
              <p className="text-sm text-muted-foreground">
                Display the site footer on this page
              </p>
            </div>
            <Switch
              id="showFooter"
              checked={showFooter}
              onCheckedChange={onShowFooterChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Basic Meta Tags */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Basic Meta Tags</CardTitle>
          </div>
          <CardDescription>
            Essential SEO metadata for search engines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={seoData.metaTitle || ''}
              onChange={(e) => handleChange('metaTitle', e.target.value)}
              placeholder="Page Title - Brand Name"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              {seoData.metaTitle?.length || 0}/60 characters (optimal: 50-60)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={seoData.metaDescription || ''}
              onChange={(e) => handleChange('metaDescription', e.target.value)}
              placeholder="A compelling description of your page content..."
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">
              {seoData.metaDescription?.length || 0}/160 characters (optimal: 150-160)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaKeywords">Meta Keywords</Label>
            <Input
              id="metaKeywords"
              value={seoData.metaKeywords || ''}
              onChange={(e) => handleChange('metaKeywords', e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated keywords (less important for modern SEO)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canonicalUrl">Canonical URL</Label>
            <Input
              id="canonicalUrl"
              value={seoData.canonicalUrl || ''}
              onChange={(e) => handleChange('canonicalUrl', e.target.value)}
              placeholder="https://example.com/page"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Prevent duplicate content issues
            </p>
          </div>
        </CardContent>
      </Card>

      {/* OpenGraph Tags */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>OpenGraph (Facebook, LinkedIn)</CardTitle>
          </div>
          <CardDescription>
            Social media sharing metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ogTitle">OG Title</Label>
            <Input
              id="ogTitle"
              value={seoData.ogTitle || ''}
              onChange={(e) => handleChange('ogTitle', e.target.value)}
              placeholder="Title for social media shares"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogDescription">OG Description</Label>
            <Textarea
              id="ogDescription"
              value={seoData.ogDescription || ''}
              onChange={(e) => handleChange('ogDescription', e.target.value)}
              placeholder="Description for social media shares"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogImage">OG Image URL</Label>
            <Input
              id="ogImage"
              value={seoData.ogImage || ''}
              onChange={(e) => handleChange('ogImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x630px
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogType">OG Type</Label>
            <Input
              id="ogType"
              value={seoData.ogType || 'website'}
              onChange={(e) => handleChange('ogType', e.target.value)}
              placeholder="website, article, product, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogUrl">OG URL</Label>
            <Input
              id="ogUrl"
              value={seoData.ogUrl || ''}
              onChange={(e) => handleChange('ogUrl', e.target.value)}
              placeholder="https://example.com/page"
              type="url"
            />
          </div>
        </CardContent>
      </Card>

      {/* Twitter Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            <CardTitle>Twitter Cards</CardTitle>
          </div>
          <CardDescription>
            Twitter-specific metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twitterCard">Card Type</Label>
            <Input
              id="twitterCard"
              value={seoData.twitterCard || 'summary_large_image'}
              onChange={(e) => handleChange('twitterCard', e.target.value)}
              placeholder="summary, summary_large_image, player"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterTitle">Twitter Title</Label>
            <Input
              id="twitterTitle"
              value={seoData.twitterTitle || ''}
              onChange={(e) => handleChange('twitterTitle', e.target.value)}
              placeholder="Title for Twitter shares"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterDescription">Twitter Description</Label>
            <Textarea
              id="twitterDescription"
              value={seoData.twitterDescription || ''}
              onChange={(e) => handleChange('twitterDescription', e.target.value)}
              placeholder="Description for Twitter shares"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterImage">Twitter Image URL</Label>
            <Input
              id="twitterImage"
              value={seoData.twitterImage || ''}
              onChange={(e) => handleChange('twitterImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterCreator">Twitter Creator</Label>
            <Input
              id="twitterCreator"
              value={seoData.twitterCreator || ''}
              onChange={(e) => handleChange('twitterCreator', e.target.value)}
              placeholder="@username"
            />
          </div>
        </CardContent>
      </Card>

      {/* Robots Meta */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <CardTitle>Search Engine Directives</CardTitle>
          </div>
          <CardDescription>
            Control how search engines index this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="robotsIndex">Index Page</Label>
              <p className="text-xs text-muted-foreground">
                Allow search engines to index this page
              </p>
            </div>
            <Switch
              id="robotsIndex"
              checked={seoData.robotsIndex !== false}
              onCheckedChange={(checked) => handleChange('robotsIndex', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="robotsFollow">Follow Links</Label>
              <p className="text-xs text-muted-foreground">
                Allow search engines to follow links on this page
              </p>
            </div>
            <Switch
              id="robotsFollow"
              checked={seoData.robotsFollow !== false}
              onCheckedChange={(checked) => handleChange('robotsFollow', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Structured Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <CardTitle>Structured Data (JSON-LD)</CardTitle>
          </div>
          <CardDescription>
            Add structured data for rich snippets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="structuredData">JSON-LD Schema</Label>
            <Textarea
              id="structuredData"
              value={seoData.structuredData || ''}
              onChange={(e) => handleChange('structuredData', e.target.value)}
              placeholder={`{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Name",
  "description": "Page description"
}`}
              rows={10}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Valid JSON-LD schema.org markup
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
