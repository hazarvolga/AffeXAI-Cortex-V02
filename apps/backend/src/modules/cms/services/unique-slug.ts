import { slugify } from "../../../common/utils/slugify.util";

const FALLBACK_SLUG = "icerik";

/**
 * Turkish-aware slug for `name` that `isTaken` reports as free, adding -1, -2, …
 * on collision. Callers scope `isTaken` to the tenant and exclude the record
 * being renamed.
 */
export async function uniqueSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || FALLBACK_SLUG;
  let candidate = base;
  for (let counter = 1; await isTaken(candidate); counter += 1) {
    candidate = `${base}-${counter}`;
  }
  return candidate;
}
