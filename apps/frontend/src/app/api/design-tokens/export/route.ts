/**
 * Design Tokens Export API
 * Export tokens in various formats (CSS, SCSS, JSON, W3C)
 * GET /api/design-tokens/export?context=admin&mode=dark&format=css
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ThemeContext, ThemeMode } from '@/types/design-tokens';
import {
  defaultTokens,
  adminLightTokens,
  adminDarkTokens,
  portalLightTokens,
  portalDarkTokens,
} from '@/lib/design-tokens/default-tokens';
import {
  exportToCSS,
  exportToSCSS,
  exportToJSON,
  resolveAllTokens,
} from '@/lib/design-tokens/resolver';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const context = (searchParams.get('context') || 'public') as ThemeContext;
    const mode = (searchParams.get('mode') || 'light') as ThemeMode;
    const format = searchParams.get('format') || 'json'; // css | scss | json | w3c
    const prefix = searchParams.get('prefix') || '';

    // Get tokens
    let tokens =
      context === 'admin'
        ? mode === 'dark'
          ? adminDarkTokens
          : adminLightTokens
        : context === 'portal'
        ? mode === 'dark'
          ? portalDarkTokens
          : portalLightTokens
        : mode === 'dark'
        ? adminDarkTokens
        : defaultTokens;

    // Export based on format
    switch (format) {
      case 'css': {
        const css = exportToCSS(resolveAllTokens(tokens), {
          selector: `.theme-${context}`,
          prefix: prefix || undefined,
        });

        return new NextResponse(css, {
          headers: {
            'Content-Type': 'text/css',
            'Content-Disposition': `attachment; filename="${context}-${mode}-tokens.css"`,
          },
        });
      }

      case 'scss': {
        const scss = exportToSCSS(resolveAllTokens(tokens), {
          prefix: prefix || undefined,
          useVariables: true,
        });

        return new NextResponse(scss, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${context}-${mode}-tokens.scss"`,
          },
        });
      }

      case 'w3c': {
        const w3c = exportToJSON(tokens, {
          exportedAt: new Date().toISOString(),
          name: `${context}-${mode}`,
          description: `Design tokens for ${context} theme (${mode} mode)`,
          author: 'AffeXAI Cortex Design System',
        });

        return NextResponse.json(w3c, {
          headers: {
            'Content-Disposition': `attachment; filename="${context}-${mode}-tokens.json"`,
          },
        });
      }

      case 'json':
      default: {
        return NextResponse.json(tokens, {
          headers: {
            'Content-Disposition': `attachment; filename="${context}-${mode}-tokens.json"`,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error exporting design tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export tokens',
      },
      { status: 500 }
    );
  }
}
