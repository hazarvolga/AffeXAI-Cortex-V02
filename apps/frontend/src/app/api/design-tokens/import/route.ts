/**
 * Design Tokens Import API
 * Import tokens from W3C JSON format
 * POST /api/design-tokens/import
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TokenExportFormat } from '@/types/design-tokens';
import { importFromJSON, validateTokens } from '@/lib/design-tokens/resolver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate format
    if (!body.format || body.format !== 'w3c-design-tokens') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid format. Expected W3C Design Tokens format',
        },
        { status: 400 }
      );
    }

    const tokenData = body as TokenExportFormat;

    // Import tokens
    const tokens = importFromJSON(tokenData);

    // Validate structure
    const validation = validateTokens(tokens);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token structure',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // TODO: Save to database
    // Extract context and mode from metadata
    const { context, mode } = body.metadata || {};

    return NextResponse.json({
      success: true,
      message: 'Tokens imported successfully',
      data: tokens,
      metadata: tokenData.metadata,
    });
  } catch (error) {
    console.error('Error importing design tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import tokens',
      },
      { status: 500 }
    );
  }
}
