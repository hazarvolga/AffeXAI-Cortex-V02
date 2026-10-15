/**
 * Template colours are stored as CSS colours or as bare HSL channels
 * ("220 9% 39%"). Anything else (objects from older templates) has no swatch.
 */
export function toCssColor(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.includes(" ") && !value.includes("(") ? `hsl(${value})` : value;
}
