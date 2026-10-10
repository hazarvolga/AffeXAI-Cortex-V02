import {
  Module,
  Global,
  MiddlewareConsumer,
  RequestMethod,
} from "@nestjs/common";
import { TenantService } from "./tenant.service";
import { TenantMiddleware } from "./tenant.middleware";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TenantInterceptor } from "./tenant.interceptor";

@Global()
@Module({
  providers: [
    TenantService,
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
  exports: [TenantService],
})
export class TenantModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
