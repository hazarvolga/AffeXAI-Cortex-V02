/**
 * Turkish-aware slug generation utility
 *
 * Converts Turkish text to URL-friendly slugs while preserving Turkish characters
 *
 * @example
 * slugify('Ürünlerimiz') → 'urunlerimiz'
 * slugify('Şirket Hakkında') → 'sirket-hakkinda'
 * slugify('İletişim & Destek') → 'iletisim-destek'
 */

/**
 * Turkish character mapping for slug generation
 * Maps Turkish characters to their ASCII equivalents for URL safety
 */
const TURKISH_CHAR_MAP: Record<string, string> = {
  // Lowercase
  'ç': 'c',
  'ğ': 'g',
  'ı': 'i',
  'i': 'i',
  'ö': 'o',
  'ş': 's',
  'ü': 'u',

  // Uppercase
  'Ç': 'c',
  'Ğ': 'g',
  'İ': 'i',
  'I': 'i',
  'Ö': 'o',
  'Ş': 's',
  'Ü': 'u',
};

/**
 * Extended character map for other common characters
 */
const EXTENDED_CHAR_MAP: Record<string, string> = {
  // Accented characters
  'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a', 'ā': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'ē': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ī': 'i',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ø': 'o', 'ō': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ū': 'u',
  'ý': 'y', 'ÿ': 'y',
  'ñ': 'n',
  'ç': 'c',

  // Uppercase
  'Á': 'a', 'À': 'a', 'Â': 'a', 'Ä': 'a', 'Ã': 'a', 'Å': 'a', 'Ā': 'a',
  'É': 'e', 'È': 'e', 'Ê': 'e', 'Ë': 'e', 'Ē': 'e',
  'Í': 'i', 'Ì': 'i', 'Î': 'i', 'Ï': 'i', 'Ī': 'i',
  'Ó': 'o', 'Ò': 'o', 'Ô': 'o', 'Õ': 'o', 'Ø': 'o', 'Ō': 'o',
  'Ú': 'u', 'Ù': 'u', 'Û': 'u', 'Ū': 'u',
  'Ý': 'y', 'Ÿ': 'y',
  'Ñ': 'n',
  'Ç': 'c',

  // Special symbols
  '&': 've',
  '@': 'at',
  '%': 'yuzde',
  '+': 'arti',
  '=': 'esittir',
  '<': 'kucuktur',
  '>': 'buyuktur',
  '₺': 'tl',
  '$': 'dolar',
  '€': 'euro',
  '£': 'sterlin',
};

/**
 * Generate URL-friendly slug from text
 *
 * Features:
 * - Converts Turkish characters to ASCII equivalents
 * - Replaces spaces with hyphens
 * - Removes special characters
 * - Converts to lowercase
 * - Removes multiple consecutive hyphens
 * - Trims leading/trailing hyphens
 *
 * @param text - Input text to slugify
 * @param options - Slugify options
 * @returns URL-friendly slug
 */
export function slugify(
  text: string,
  options?: {
    /** Preserve Turkish characters instead of converting to ASCII (default: false) */
    preserveTurkish?: boolean;
    /** Custom separator (default: '-') */
    separator?: string;
    /** Convert to lowercase (default: true) */
    lowercase?: boolean;
    /** Remove special characters (default: true) */
    strict?: boolean;
  }
): string {
  const {
    preserveTurkish = false,
    separator = '-',
    lowercase = true,
    strict = true,
  } = options || {};

  let slug = text.trim();

  // Convert to lowercase first if needed
  if (lowercase) {
    // Use Turkish locale for proper lowercase conversion (İ → i, I → ı)
    slug = slug.toLocaleLowerCase('tr-TR');
  }

  if (!preserveTurkish) {
    // Replace Turkish characters with ASCII equivalents
    slug = slug.split('').map(char => TURKISH_CHAR_MAP[char] || char).join('');

    // Replace extended characters
    slug = slug.split('').map(char => EXTENDED_CHAR_MAP[char] || char).join('');
  }

  if (strict) {
    if (preserveTurkish) {
      // Keep Turkish characters + alphanumeric + separator
      slug = slug.replace(new RegExp(`[^a-z0-9çğıöşüÇĞİÖŞÜ${separator}]`, 'gi'), separator);
    } else {
      // Only alphanumeric + separator
      slug = slug.replace(new RegExp(`[^a-z0-9${separator}]`, 'gi'), separator);
    }
  }

  // Replace spaces with separator
  slug = slug.replace(/\s+/g, separator);

  // Remove multiple consecutive separators
  const separatorRegex = new RegExp(`${separator}+`, 'g');
  slug = slug.replace(separatorRegex, separator);

  // Remove leading/trailing separators
  const trimRegex = new RegExp(`^${separator}+|${separator}+$`, 'g');
  slug = slug.replace(trimRegex, '');

  return slug;
}

/**
 * Generate unique slug by appending counter if slug exists
 *
 * @param baseSlug - Base slug to make unique
 * @param checkExists - Async function to check if slug exists
 * @param excludeId - ID to exclude from uniqueness check (for updates)
 * @returns Unique slug
 *
 * @example
 * await generateUniqueSlug('products', async (slug) => {
 *   return await db.pages.exists({ slug });
 * });
 * // Returns: 'products', 'products-2', 'products-3', etc.
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

/**
 * Validate if a string is a valid slug
 *
 * @param slug - String to validate
 * @param options - Validation options
 * @returns True if valid slug
 */
export function isValidSlug(
  slug: string,
  options?: {
    /** Allow Turkish characters (default: false) */
    allowTurkish?: boolean;
    /** Minimum length (default: 1) */
    minLength?: number;
    /** Maximum length (default: 255) */
    maxLength?: number;
  }
): boolean {
  const { allowTurkish = false, minLength = 1, maxLength = 255 } = options || {};

  if (slug.length < minLength || slug.length > maxLength) {
    return false;
  }

  const pattern = allowTurkish
    ? /^[a-z0-9çğıöşü]+(?:-[a-z0-9çğıöşü]+)*$/
    : /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  return pattern.test(slug);
}
