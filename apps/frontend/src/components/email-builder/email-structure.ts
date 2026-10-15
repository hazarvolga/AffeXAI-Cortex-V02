/** Email builder document model and pure, immutable edits on it. */

export interface EmailBlock {
  id: string;
  type: string;
  properties: Record<string, any>;
  styles: Record<string, any>;
}

export interface EmailColumn {
  id: string;
  width: string;
  blocks: EmailBlock[];
}

export interface EmailRow {
  id: string;
  type: string;
  columns: EmailColumn[];
  settings: Record<string, any>;
}

export interface EmailStructure {
  rows: EmailRow[];
  settings: {
    backgroundColor?: string;
    contentWidth?: string;
    fonts?: string[];
  };
}

const DEFAULT_PROPERTIES: Record<string, Record<string, any>> = {
  heading: { text: "Başlık Metni", level: "h1", align: "left" },
  text: { text: "Paragraf metni buraya yazılacak", align: "left" },
  button: { text: "Tıklayın", href: "#", align: "center" },
  image: {
    src: "https://via.placeholder.com/600x400",
    alt: "Resim",
    align: "center",
  },
  divider: {},
  spacer: { height: "20px" },
};

const DEFAULT_STYLES: Record<string, Record<string, any>> = {
  heading: { fontSize: "24px", fontWeight: "bold", color: "#333333" },
  text: { fontSize: "14px", color: "#333333", lineHeight: "1.6" },
  button: {
    backgroundColor: "#0066cc",
    color: "#ffffff",
    borderRadius: "4px",
    padding: "12px 24px",
  },
  image: { width: "100%" },
  divider: { borderColor: "#dddddd", borderWidth: "1px" },
  spacer: { height: "20px" },
};

export function getDefaultProperties(blockType: string): Record<string, any> {
  return { ...(DEFAULT_PROPERTIES[blockType] ?? {}) };
}

export function getDefaultStyles(blockType: string): Record<string, any> {
  return { ...(DEFAULT_STYLES[blockType] ?? {}) };
}

/** A full-width row holding one new block of the given type. */
export function createBlockRow(
  blockType: string,
  makeId: () => string,
): EmailRow {
  return {
    id: makeId(),
    type: "section",
    columns: [
      {
        id: makeId(),
        width: "100%",
        blocks: [
          {
            id: makeId(),
            type: blockType,
            properties: getDefaultProperties(blockType),
            styles: getDefaultStyles(blockType),
          },
        ],
      },
    ],
    settings: {},
  };
}

export function appendBlock(
  structure: EmailStructure,
  blockType: string,
  makeId: () => string,
): EmailStructure {
  return {
    ...structure,
    rows: [...structure.rows, createBlockRow(blockType, makeId)],
  };
}

export function replaceBlock(
  structure: EmailStructure,
  updated: EmailBlock,
): EmailStructure {
  const hasBlock = (row: EmailRow) =>
    row.columns.some((column) =>
      column.blocks.some((block) => block.id === updated.id),
    );
  return {
    ...structure,
    rows: structure.rows.map((row) =>
      hasBlock(row)
        ? {
            ...row,
            columns: row.columns.map((column) => ({
              ...column,
              blocks: column.blocks.map((block) =>
                block.id === updated.id ? updated : block,
              ),
            })),
          }
        : row,
    ),
  };
}
