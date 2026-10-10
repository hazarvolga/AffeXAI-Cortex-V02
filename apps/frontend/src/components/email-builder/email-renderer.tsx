import React from 'react';
import { Html, Head, Body, Container, Section, render } from '@react-email/components';
import { BlockRegistry, Block } from './block-registry';

/**
 * Email Renderer - Converts block structure to React Email components
 * Used for server-side HTML generation
 */

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

interface EmailTemplateProps {
  structure: EmailStructure;
}

/**
 * Main Email Template Component
 * Renders the complete email structure using React Email
 */
export function EmailTemplate({ structure }: EmailTemplateProps) {
  const { settings, rows } = structure;

  return (
    <Html>
      <Head>
        {settings.fonts?.map((font, index) => (
          <link
            key={index}
            href={`https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}&display=swap`}
            rel="stylesheet"
          />
        ))}
      </Head>
      <Body style={{ backgroundColor: settings.backgroundColor || '#f5f5f5' }}>
        <Container
          style={{
            maxWidth: settings.contentWidth || '600px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
          }}
        >
          {rows.map((row) => (
            <RowRenderer key={row.id} row={row} />
          ))}
        </Container>
      </Body>
    </Html>
  );
}

/**
 * Row Renderer Component
 * Handles layout of columns within a row
 */
function RowRenderer({ row }: { row: Row }) {
  const { columns, settings } = row;

  return (
    <Section
      style={{
        padding: settings.padding || '16px',
        backgroundColor: settings.backgroundColor || 'transparent',
      }}
    >
      {columns.length === 1 ? (
        // Single column layout
        <div style={{ width: '100%' }}>
          {columns[0].blocks.map((block) => (
            <BlockRendererEmail key={block.id} block={block} />
          ))}
        </div>
      ) : (
        // Multi-column layout
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              {columns.map((column) => (
                <td
                  key={column.id}
                  style={{
                    width: column.width,
                    verticalAlign: 'top',
                    padding: '0 8px',
                  }}
                >
                  {column.blocks.map((block) => (
                    <BlockRendererEmail key={block.id} block={block} />
                  ))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      )}
    </Section>
  );
}

/**
 * Block Renderer for Email
 * Uses BlockRegistry to render appropriate React Email component
 */
function BlockRendererEmail({ block }: { block: Block }) {
  const BlockComponent = BlockRegistry[block.type];

  if (!BlockComponent) {
    // Fallback for unsupported blocks
    return (
      <div
        style={{
          padding: '8px',
          backgroundColor: '#f5f5f5',
          border: '1px dashed #ccc',
          textAlign: 'center',
          fontSize: '12px',
          color: '#666',
        }}
      >
        Unsupported block: {block.type}
      </div>
    );
  }

  return <BlockComponent block={block} />;
}

/**
 * Render email structure to HTML string
 * This is the main export for backend usage
 */
export async function renderEmailToHtml(structure: EmailStructure): Promise<string> {
  try {
    const html = render(<EmailTemplate structure={structure} />);
    return html;
  } catch (error) {
    console.error('Error rendering email:', error);
    throw new Error(`Failed to render email: ${(error instanceof Error ? error.message : String(error))}`);
  }
}

/**
 * Validate email structure before rendering
 */
export function validateEmailStructure(structure: EmailStructure): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

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
            `Row ${rowIndex}, Column ${columnIndex}, Block ${blockIndex} must have type`
          );
        }
        if (!block.properties || typeof block.properties !== 'object') {
          errors.push(
            `Row ${rowIndex}, Column ${columnIndex}, Block ${blockIndex} must have properties object`
          );
        }
        if (!block.styles || typeof block.styles !== 'object') {
          errors.push(
            `Row ${rowIndex}, Column ${columnIndex}, Block ${blockIndex} must have styles object`
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
