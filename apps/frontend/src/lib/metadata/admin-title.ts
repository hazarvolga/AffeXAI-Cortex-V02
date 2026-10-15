import type { Metadata } from "next";

export const ADMIN_TITLE_TEMPLATE = "%s · AffeXAI Cortex";
export const PORTAL_TITLE_TEMPLATE = "%s · Portal · AffeXAI";

/**
 * Title for a tenant admin layout. Next.js only passes a title template on to
 * child segments when the layout's title is an object, so a plain string would
 * drop the " · AffeXAI Cortex" suffix from every page below it.
 */
export function adminTitle(name: string): NonNullable<Metadata["title"]> {
  return { default: name, template: ADMIN_TITLE_TEMPLATE };
}

/** Same as adminTitle for portal layouts that have titled pages below them. */
export function portalTitle(name: string): NonNullable<Metadata["title"]> {
  return { default: name, template: PORTAL_TITLE_TEMPLATE };
}
