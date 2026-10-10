'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw } from 'lucide-react';

export function EmailPreview({
  structure,
  previewMode,
}: {
  structure: any;
  previewMode: 'desktop' | 'mobile';
}) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const renderPreview = async () => {
    setLoading(true);
    setError('');

    try {
      // TODO: Call backend API to render MJML to HTML
      // For now, we'll create a simple HTML preview
      const previewHtml = createSimpleHtmlPreview(structure);
      setHtml(previewHtml);
    } catch (err: any) {
      setError(err.message || 'Preview oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    renderPreview();
  }, [structure]);

  const previewWidth = previewMode === 'mobile' ? '375px' : '600px';

  return (
    <div className="w-[400px] border-l bg-card flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Canlı Önizleme</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={renderPreview}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Yenile
        </Button>
      </div>

      <ScrollArea className="flex-1 bg-muted/20 p-4">
        {error ? (
          <Card className="p-6 text-center">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex justify-center">
            <Card className="bg-white shadow-lg overflow-hidden" style={{ width: previewWidth }}>
              <iframe
                srcDoc={html}
                title="Email Preview"
                className="w-full border-0"
                style={{ height: '800px' }}
                sandbox="allow-same-origin"
              />
            </Card>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-muted/50">
        <p className="text-xs text-muted-foreground">
          ℹ️ Önizleme gerçek email görünümüne yakındır ancak email istemcileri arası
          farklılıklar olabilir.
        </p>
      </div>
    </div>
  );
}

function createSimpleHtmlPreview(structure: any): string {
  const backgroundColor = structure.settings?.backgroundColor || '#f5f5f5';
  const contentWidth = structure.settings?.contentWidth || '600px';

  const rowsHtml = (structure.rows || [])
    .map((row: any) => {
      const columnsHtml = (row.columns || [])
        .map((column: any) => {
          const blocksHtml = (column.blocks || [])
            .map((block: any) => renderBlockHtml(block))
            .join('');
          return `
            <td style="width: ${column.width}; vertical-align: top;">
              ${blocksHtml}
            </td>
          `;
        })
        .join('');

      return `
        <tr>
          ${columnsHtml}
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Preview</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-color: ${backgroundColor};
        }
        table {
          border-spacing: 0;
          border-collapse: collapse;
        }
        img {
          border: 0;
          display: block;
        }
      </style>
    </head>
    <body>
      <table role="presentation" style="width: 100%; background-color: ${backgroundColor};">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table role="presentation" style="width: ${contentWidth}; background-color: #ffffff;">
              ${rowsHtml}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function renderBlockHtml(block: any): string {
  const props = block.properties || {};
  const styles = block.styles || {};

  switch (block.type) {
    case 'heading':
      return `
        <h1 style="
          font-size: ${styles.fontSize || '24px'};
          font-weight: ${styles.fontWeight || 'bold'};
          color: ${styles.color || '#333333'};
          text-align: ${props.align || 'left'};
          margin: 10px 0;
        ">
          ${props.text || 'Başlık Metni'}
        </h1>
      `;

    case 'text':
      return `
        <p style="
          font-size: ${styles.fontSize || '14px'};
          color: ${styles.color || '#333333'};
          text-align: ${props.align || 'left'};
          line-height: ${styles.lineHeight || '1.6'};
          margin: 10px 0;
        ">
          ${props.text || 'Paragraf metni'}
        </p>
      `;

    case 'button':
      return `
        <div style="text-align: ${props.align || 'center'}; padding: 10px 0;">
          <a href="${props.href || '#'}" style="
            display: inline-block;
            background-color: ${styles.backgroundColor || '#0066cc'};
            color: ${styles.color || '#ffffff'};
            padding: ${styles.padding || '12px 24px'};
            border-radius: ${styles.borderRadius || '4px'};
            font-size: ${styles.fontSize || '14px'};
            font-weight: ${styles.fontWeight || 'bold'};
            text-decoration: none;
          ">
            ${props.text || 'Tıklayın'}
          </a>
        </div>
      `;

    case 'image':
      const imgHtml = `
        <img
          src="${props.src || 'https://via.placeholder.com/600x400'}"
          alt="${props.alt || 'Resim'}"
          style="width: ${styles.width || '100%'}; max-width: 100%; height: auto;"
        />
      `;
      return `
        <div style="text-align: ${props.align || 'center'}; padding: 10px 0;">
          ${props.href ? `<a href="${props.href}">${imgHtml}</a>` : imgHtml}
        </div>
      `;

    case 'divider':
      return `
        <hr style="
          border: 0;
          border-top: ${styles.borderWidth || '1px'} solid ${styles.borderColor || '#dddddd'};
          margin: 10px 0;
        " />
      `;

    case 'spacer':
      return `<div style="height: ${styles.height || '20px'};"></div>`;

    default:
      return `<div style="padding: 10px; background: #f0f0f0; text-align: center;">${block.type}</div>`;
  }
}
