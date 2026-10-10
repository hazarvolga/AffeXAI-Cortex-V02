import { Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/components';
import * as React from 'react';

/**
 * Block Renderer Service
 * Converts email builder block structures to production-ready HTML
 * Uses React Email for server-side rendering
 */

interface Block {
  id: string;
  type: string;
  properties: Record<string, any>;
  styles: Record<string, any>;
}

interface Column {
  id: string;
  width: string;
  blocks: Block[];
}

interface Row {
  id: string;
  type: string;
  columns: Column[];
  settings: Record<string, any>;
}

interface EmailStructure {
  rows: Row[];
  settings: {
    backgroundColor?: string;
    contentWidth?: string;
    fonts?: string[];
  };
}

@Injectable()
export class BlockRendererService {
  private readonly logger = new Logger(BlockRendererService.name);

  /**
   * Render email structure to HTML
   * Main entry point for email generation
   */
  async renderToHtml(structure: EmailStructure): Promise<string> {
    try {
      this.logger.log('Starting email render process');

      // Validate structure
      const validation = this.validateStructure(structure);
      if (!validation.valid) {
        throw new Error(`Invalid email structure: ${validation.errors.join(', ')}`);
      }

      // Generate HTML
      const html = await this.generateHtml(structure);

      this.logger.log('Email render completed successfully');
      return html;
    } catch (error) {
      this.logger.error(`Email render failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate email structure before rendering
   */
  private validateStructure(structure: EmailStructure): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!structure) {
      errors.push('Email structure is null or undefined');
      return { valid: false, errors };
    }

    if (!structure.rows || !Array.isArray(structure.rows)) {
      errors.push('Email structure must have rows array');
    }

    if (!structure.settings || typeof structure.settings !== 'object') {
      errors.push('Email structure must have settings object');
    }

    structure.rows?.forEach((row, rowIndex) => {
      if (!row.columns || !Array.isArray(row.columns)) {
        errors.push(`Row ${rowIndex} must have columns array`);
      }

      row.columns?.forEach((column, columnIndex) => {
        if (!column.blocks || !Array.isArray(column.blocks)) {
          errors.push(`Row ${rowIndex}, Column ${columnIndex} must have blocks array`);
        }

        column.blocks?.forEach((block, blockIndex) => {
          if (!block.type) {
            errors.push(
              `Row ${rowIndex}, Column ${columnIndex}, Block ${blockIndex} must have type`,
            );
          }
          if (!block.properties || typeof block.properties !== 'object') {
            errors.push(
              `Row ${rowIndex}, Column ${columnIndex}, Block ${blockIndex} must have properties object`,
            );
          }
          if (!block.styles || typeof block.styles !== 'object') {
            errors.push(
              `Row ${rowIndex}, Column ${columnIndex}, Block ${blockIndex} must have styles object`,
            );
          }
        });
      });
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate HTML from structure
   * Currently returns simplified HTML - will be enhanced with React Email in Phase 3.2
   */
  private async generateHtml(structure: EmailStructure): Promise<string> {
    const { settings, rows } = structure;

    // Build HTML structure
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>`;

    // Add font imports
    if (settings.fonts && settings.fonts.length > 0) {
      settings.fonts.forEach((font) => {
        html += `\n  <link href="https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}&display=swap" rel="stylesheet">`;
      });
    }

    html += `
</head>
<body style="margin: 0; padding: 0; background-color: ${settings.backgroundColor || '#f5f5f5'};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table width="${settings.contentWidth || '600'}" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">`;

    // Render rows
    for (const row of rows) {
      html += this.renderRow(row);
    }

    html += `
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return html;
  }

  /**
   * Render a single row
   */
  private renderRow(row: Row): string {
    const { columns, settings } = row;
    const padding = settings.padding || '16px';
    const backgroundColor = settings.backgroundColor || 'transparent';

    let html = `
          <tr>
            <td style="padding: ${padding}; background-color: ${backgroundColor};">`;

    if (columns.length === 1) {
      // Single column layout
      html += this.renderColumn(columns[0]);
    } else {
      // Multi-column layout
      html += `
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>`;

      columns.forEach((column) => {
        html += `
                  <td width="${column.width}" valign="top" style="padding: 0 8px;">
                    ${this.renderColumn(column)}
                  </td>`;
      });

      html += `
                </tr>
              </table>`;
    }

    html += `
            </td>
          </tr>`;

    return html;
  }

  /**
   * Render a single column
   */
  private renderColumn(column: Column): string {
    let html = '';

    for (const block of column.blocks) {
      html += this.renderBlock(block);
    }

    return html;
  }

  /**
   * Render a single block
   * Maps block types to HTML output
   */
  private renderBlock(block: Block): string {
    switch (block.type) {
      case 'text':
        return this.renderTextBlock(block);
      case 'heading':
        return this.renderHeadingBlock(block);
      case 'button':
        return this.renderButtonBlock(block);
      case 'image':
        return this.renderImageBlock(block);
      case 'divider':
        return this.renderDividerBlock(block);
      case 'spacer':
        return this.renderSpacerBlock(block);
      default:
        return `<div style="padding: 8px; background-color: #f5f5f5; border: 1px dashed #ccc; text-align: center; font-size: 12px; color: #666;">Unsupported block: ${block.type}</div>`;
    }
  }

  /**
   * Render text block
   */
  private renderTextBlock(block: Block): string {
    const { content = 'Text content' } = block.properties;
    const {
      color = '#333333',
      fontSize = '16px',
      fontWeight = 'normal',
      textAlign = 'left',
      lineHeight = '1.5',
    } = block.styles;

    return `<p style="color: ${color}; font-size: ${fontSize}; font-weight: ${fontWeight}; text-align: ${textAlign}; line-height: ${lineHeight}; margin: 0 0 16px 0;">${content}</p>`;
  }

  /**
   * Render heading block
   */
  private renderHeadingBlock(block: Block): string {
    const { level = 2, content = 'Heading' } = block.properties;
    const {
      color = '#000000',
      fontSize,
      fontWeight = 'bold',
      textAlign = 'left',
      marginTop = '24px',
      marginBottom = '16px',
    } = block.styles;

    const defaultFontSizes = { 1: '32px', 2: '28px', 3: '24px', 4: '20px', 5: '18px', 6: '16px' };
    const headingFontSize = fontSize || defaultFontSizes[level] || '24px';

    return `<h${level} style="color: ${color}; font-size: ${headingFontSize}; font-weight: ${fontWeight}; text-align: ${textAlign}; margin: ${marginTop} 0 ${marginBottom} 0; line-height: 1.2;">${content}</h${level}>`;
  }

  /**
   * Render button block
   */
  private renderButtonBlock(block: Block): string {
    const { text = 'Click Here', url = '#' } = block.properties;
    const {
      backgroundColor = '#007bff',
      color = '#ffffff',
      fontSize = '16px',
      fontWeight = '600',
      borderRadius = '4px',
      paddingX = '32px',
      paddingY = '12px',
      align = 'center',
    } = block.styles;

    return `
      <div style="text-align: ${align}; margin: 16px 0;">
        <a href="${url}" style="background-color: ${backgroundColor}; color: ${color}; font-size: ${fontSize}; font-weight: ${fontWeight}; border-radius: ${borderRadius}; padding: ${paddingY} ${paddingX}; text-decoration: none; display: inline-block; border: none;">${text}</a>
      </div>`;
  }

  /**
   * Render image block
   */
  private renderImageBlock(block: Block): string {
    const {
      src = 'https://via.placeholder.com/600x400',
      alt = 'Image',
      width = '600',
      height,
    } = block.properties;
    const { align = 'center', borderRadius = '0' } = block.styles;

    const heightAttr = height ? `height="${height}"` : '';

    return `
      <div style="text-align: ${align}; margin: 16px 0;">
        <img src="${src}" alt="${alt}" width="${width}" ${heightAttr} style="border-radius: ${borderRadius}; max-width: 100%; display: inline-block;" />
      </div>`;
  }

  /**
   * Render divider block
   */
  private renderDividerBlock(block: Block): string {
    const {
      color = '#e0e0e0',
      height = '1px',
      marginTop = '16px',
      marginBottom = '16px',
      borderStyle = 'solid',
    } = block.styles;

    return `<hr style="border-color: ${color}; border-width: ${height}; border-style: ${borderStyle}; margin: ${marginTop} 0 ${marginBottom} 0; width: 100%;" />`;
  }

  /**
   * Render spacer block
   */
  private renderSpacerBlock(block: Block): string {
    const { height = '20px' } = block.styles;
    return `<div style="height: ${height};"></div>`;
  }
}
