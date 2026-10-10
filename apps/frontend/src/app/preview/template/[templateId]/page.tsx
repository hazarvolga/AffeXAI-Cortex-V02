"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TemplateRenderer } from '@/components/cms/template-renderer';
import type { PageTemplate } from '@/types/cms-template';

export default function TemplatePreviewPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const [template, setTemplate] = useState<PageTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        setIsLoading(true);
        
        // Load template from JSON file (temporary until API is ready)
        const response = await fetch(`/demo-templates/${templateId}.json`);
        
        if (!response.ok) {
          throw new Error(`Template not found: ${templateId}`);
        }
        
        const data = await response.json();
        setTemplate(data);
      } catch (err) {
        console.error('Error loading template:', err);
        setError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setIsLoading(false);
      }
    }

    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">{error || 'Template not found'}</p>
          <a href="/admin/cms/templates" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Back to Templates
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`template-preview ${template.designSystem.preferredMode === 'dark' ? 'dark' : ''}`}>
      {/* Preview Header */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900 text-white py-2 px-4 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/admin/cms/templates" className="text-sm hover:underline">
            ← Back
          </a>
          <span className="text-sm opacity-75">Preview:</span>
          <span className="font-semibold">{template.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-gray-800 px-2 py-1 rounded">
            {template.designSystem.preferredMode}
          </span>
          <span className="text-xs bg-gray-800 px-2 py-1 rounded">
            {template.blocks.length} blocks
          </span>
        </div>
      </div>

      {/* Template Content */}
      <div className="pt-12">
        <TemplateRenderer
          template={template}
          pageId={`preview-${templateId}`}
          enableTracking={true}
        />
      </div>
    </div>
  );
}
