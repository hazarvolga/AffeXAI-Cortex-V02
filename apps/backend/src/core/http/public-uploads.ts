import { static as serveStatic, Express } from 'express';
import { join } from 'node:path';

/** Private chat, ticket and certificate files must never inherit public static access. */
export function mountPublicUploads(app: Pick<Express, 'use'>, uploadRoot: string): void {
  app.use('/uploads/public', serveStatic(join(uploadRoot, 'public'), {
    dotfiles: 'deny', index: false, redirect: false,
    setHeaders(response) {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    },
  }));
}
