/**
 * Visible keyboard focus on the dark marketing canvas (token: --ring). Ring
 * utilities, like components/ui/button, because tailwind-merge drops
 * `outline` when `outline-2` is also present.
 */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Page gutter: 16px on phones, growing with the viewport. */
export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

export const SECTION = "border-t border-border py-16 md:py-24";

export const EYEBROW = "text-sm font-medium text-muted-foreground";

export const H1 =
  "text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl";

export const H2 =
  "text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-3xl";

export const H3 = "text-lg font-semibold leading-snug text-foreground";

export const LEAD = "text-lg leading-relaxed text-muted-foreground md:text-xl";

export const BODY = "text-base leading-relaxed text-muted-foreground";

export const TEXT_LINK = `font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-primary ${FOCUS_RING}`;
