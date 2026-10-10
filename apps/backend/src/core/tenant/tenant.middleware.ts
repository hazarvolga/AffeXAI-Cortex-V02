import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from "@nestjs/common";
import { Response, NextFunction } from "express";
import { TenantRequest } from "./tenant-request";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: TenantRequest, _res: Response, next: NextFunction) {
    const hint = req.headers["x-tenant-id"];
    if (
      hint !== undefined &&
      (typeof hint !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(hint))
    ) {
      throw new BadRequestException("Invalid tenant identifier");
    }
    // Public content may use this explicit selector. It is not an authenticated
    // context: unsigned JWT claims, arbitrary URL segments and defaults are ignored.
    req.tenantHint = typeof hint === "string" ? hint : undefined;
    next();
  }
}
