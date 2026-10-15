"use client";

/**
 * CMS Components Page
 * V2 Block Catalog - Shows available V2 blocks
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout, Star, Grid } from "lucide-react";
import { blockRegistry } from "@/components/cms/block-registry";
import { BlockRenderer } from "@/components/cms/editor/block-renderer";

// V2 Block metadata
const v2BlockInfo: Record<
  string,
  { category: string; description: string; icon: any }
> = {
  "v2-hero-simple": {
    category: "Hero",
    description: "Simple centered hero section",
    icon: Star,
  },
  "v2-hero-with-image": {
    category: "Hero",
    description: "Split hero with image",
    icon: Star,
  },
  "v2-cta-banner": {
    category: "CTA",
    description: "Call-to-action banner",
    icon: Layout,
  },
  "v2-feature-grid": {
    category: "Features",
    description: "Feature icons grid",
    icon: Grid,
  },
  "v2-content-text": {
    category: "Content",
    description: "Rich text content",
    icon: Layout,
  },
  "v2-content-split": {
    category: "Content",
    description: "Text + image split",
    icon: Layout,
  },
  "v2-stats-grid": {
    category: "Stats",
    description: "Statistics display",
    icon: Grid,
  },
  "v2-testimonials": {
    category: "Social Proof",
    description: "Customer testimonials",
    icon: Star,
  },
  "v2-pricing": {
    category: "Pricing",
    description: "Pricing table",
    icon: Grid,
  },
  "v2-faq": { category: "Content", description: "FAQ accordion", icon: Layout },
  "v2-gallery": { category: "Media", description: "Image gallery", icon: Grid },
  "v2-footer": { category: "Layout", description: "Page footer", icon: Layout },
};

const ComponentsPage = () => {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(
    "v2-hero-simple",
  );

  const blockIds = Object.keys(blockRegistry);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Blok kataloğu</h1>
        <p className="text-muted-foreground">
          Şemayla doğrulanmış {blockIds.length} blok
        </p>
      </div>

      {/* Block List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Block List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bloklar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {blockIds.map((blockId) => {
                const info = v2BlockInfo[blockId];
                const isSelected = selectedBlock === blockId;

                return (
                  <button
                    key={blockId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedBlock(blockId)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-medium text-sm">{blockId}</div>
                    {info && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {info.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {info.description}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right - Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Önizleme</CardTitle>
              {selectedBlock && (
                <p className="text-sm text-muted-foreground">{selectedBlock}</p>
              )}
            </CardHeader>
            <CardContent>
              {selectedBlock ? (
                // A visual sample of a public block: its own headings are not part of this page.
                <div
                  className="border rounded-lg overflow-hidden"
                  aria-hidden="true"
                  inert
                >
                  <BlockRenderer blockId={selectedBlock} props={{}} />
                </div>
              ) : (
                <div className="py-16 text-center text-muted-foreground">
                  <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Önizlemek için bir blok seçin</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ComponentsPage;
