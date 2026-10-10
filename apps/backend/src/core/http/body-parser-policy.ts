import type { Application } from 'express';
import { json, urlencoded } from 'express';

export const PUBLIC_FORM_BODY_LIMIT = '64kb';

/** Mount before the application-wide parsers so public forms cannot consume 10 MB. */
export function mountPublicFormBodyParsers(app: Application): void {
  app.use(
    '/api/forms/public',
    json({ limit: PUBLIC_FORM_BODY_LIMIT }),
    urlencoded({ extended: true, limit: PUBLIC_FORM_BODY_LIMIT }),
  );
}
