/**
 * Design Tokens API - GET all tokens for a theme
 * GET /api/design-tokens?context=admin&mode=dark
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ThemeContext, ThemeMode, DesignTokens } from '@/types/design-tokens';
import {
  defaultTokens,
  adminLightTokens,
  adminDarkTokens,
  portalLightTokens,
  portalDarkTokens,
} from '@/lib/design-tokens/default-tokens';
import { resolveAllTokens, exportToJSON } from '@/lib/design-tokens/resolver';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const context = (searchParams.get('context') || 'public') as ThemeContext;
    const mode = (searchParams.get('mode') || 'light') as ThemeMode;
    const format = searchParams.get('format') || 'json'; // json | css | scss | resolved

    // Get appropriate token set
    let tokens: DesignTokens;

    if (context === 'admin') {
      tokens = mode === 'dark' ? adminDarkTokens : adminLightTokens;
    } else if (context === 'portal') {
      tokens = mode === 'dark' ? portalDarkTokens : portalLightTokens;
    } else {
      tokens = mode === 'dark' ? adminDarkTokens : defaultTokens;
    }

    // TODO: Load custom tokens from database and merge
    // const customTokens = await getCustomTokens(context, mode);
    // tokens = mergeTokens(tokens, customTokens);

    // Return based on format
    switch (format) {
      case 'resolved':
        return NextResponse.json({
          success: true,
          data: resolveAllTokens(tokens),
        });

      case 'w3c':
        return NextResponse.json({
          success: true,
          data: exportToJSON(tokens, {
            exportedAt: new Date().toISOString(),
            name: `${context}-${mode}`,
            description: `Design tokens for ${context} theme (${mode} mode)`,
          }),
        });

      case 'json':
      default:
        return NextResponse.json({
          success: true,
          data: tokens,
        });
    }
  } catch (error) {
    console.error('Error fetching design tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tokens',
      },
      { status: 500 }
    );
  }
}

/**
 * Design Tokens API - UPDATE tokens
 * PUT /api/design-tokens
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, mode, tokens } = body;

    if (!context || !mode || !tokens) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: context, mode, tokens',
        },
        { status: 400 }
      );
    }

    // Validate token structure
    // TODO: Add token validation

    // TODO: Save to database
    // await saveCustomTokens(context, mode, tokens);

    // For now, just return success (tokens are stored in localStorage on client)
    return NextResponse.json({
      success: true,
      message: 'Tokens updated successfully',
      data: tokens,
    });
  } catch (error) {
    console.error('Error updating design tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tokens',
      },
      { status: 500 }
    );
  }
}

/**
 * Design Tokens API - RESET to defaults
 * POST /api/design-tokens/reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, mode } = body;

    if (!context || !mode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: context, mode',
        },
        { status: 400 }
      );
    }

    // Get default tokens
    let tokens: DesignTokens;

    if (context === 'admin') {
      tokens = mode === 'dark' ? adminDarkTokens : adminLightTokens;
    } else if (context === 'portal') {
      tokens = mode === 'dark' ? portalDarkTokens : portalLightTokens;
    } else {
      tokens = mode === 'dark' ? adminDarkTokens : defaultTokens;
    }

    // TODO: Clear custom tokens from database
    // await clearCustomTokens(context, mode);

    return NextResponse.json({
      success: true,
      message: 'Tokens reset to defaults',
      data: tokens,
    });
  } catch (error) {
    console.error('Error resetting design tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset tokens',
      },
      { status: 500 }
    );
  }
}
