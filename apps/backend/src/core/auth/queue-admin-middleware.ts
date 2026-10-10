import { HttpException } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import type { RequestHandler } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';

class QueueAdminBoundary {}

/** Bull Board is Express middleware, so Nest controller guards do not protect it. */
export function createQueueAdminMiddleware(jwtGuard: JwtAuthGuard): RequestHandler {
  const platformGuard = new PlatformAdminGuard();
  const middleware: RequestHandler = async (request, response, next) => {
    const context = new ExecutionContextHost([request, response, next], QueueAdminBoundary, middleware);
    try {
      await jwtGuard.canActivate(context);
      platformGuard.canActivate(context);
      next();
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : 503;
      response.status(status).json({ statusCode: status, message: 'Platform queue access denied' });
    }
  };
  return middleware;
}
