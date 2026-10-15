import { mountPublicUploads } from "./core/http/public-uploads";
import { API_ALLOWED_HEADERS, isAllowedOrigin } from "./core/http/cors-policy";
import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, ClassSerializerInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import compression from "compression";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ResponseInterceptor } from "./common/interceptors";
import { GlobalExceptionFilter } from "./common/filters";
import { mountPublicFormBodyParsers } from "./core/http/body-parser-policy";
import { resolveTrustProxy } from "./core/http/proxy-policy";

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      rawBody: true,
    });

    // Get configuration service
    const configService = app.get(ConfigService);
    // Rate limits and audit logs key on req.ip, so it must be the browser's address.
    const trustProxy = resolveTrustProxy({
      hops: configService.get<string>("TRUST_PROXY_HOPS"),
      subnets: configService.get<string>("TRUST_PROXY_SUBNETS"),
    });
    if (trustProxy !== false) {
      app.set("trust proxy", trustProxy);
    }

    // Debug Configuration
    console.log("🔧 Initializing backend with config:");
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   - REDIS_HOST: ${configService.get("REDIS_HOST", "N/A")}`);
    console.log(`   - DB_HOST: ${configService.get("DB_HOST", "N/A")}`);
    console.log(`   - PORT: ${configService.get("PORT", "N/A")}`);

    // Set global API prefix
    app.setGlobalPrefix("api");

    // Allow bounded CMS documents and structured application payloads.
    // Nest preserves exact raw bytes for signed webhook verification.
    mountPublicFormBodyParsers(app.getHttpAdapter().getInstance());
    app.useBodyParser("json", { limit: "10mb" });
    app.useBodyParser("urlencoded", { extended: true, limit: "10mb" });

    // Security with Helmet
    app.use(helmet());
    mountPublicUploads(
      app.getHttpAdapter().getInstance(),
      join(process.cwd(), "uploads"),
    );

    // Response compression
    app.use(compression());

    // CORS configuration (environment-based)
    const allowedOrigins = configService
      .get<string>(
        "CORS_ORIGINS",
        "http://localhost:9003,http://127.0.0.1:9003",
      )
      .split(",")
      .map((origin) => origin.trim());

    console.log("🌐 CORS enabled for origins:", allowedOrigins);

    app.enableCors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin, allowedOrigins, process.env.NODE_ENV)) {
          return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [...API_ALLOWED_HEADERS],
      exposedHeaders: ["Authorization"],
      maxAge: 86400, // 24 hours
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Global ClassSerializerInterceptor for @Exclude() decorators
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    // Global response interceptor (wraps all responses in ApiResponse format)
    app.useGlobalInterceptors(new ResponseInterceptor());

    // Global exception filter (formats all errors in ApiResponse format)
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle("AffeXAI Cortex API")
      .setDescription("AffeXAI Cortex platform API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);

    // Get port from environment variables or default to 9006
    const port = configService.get<number>("PORT", 9006);

    // Start the application
    await app.listen(port, "0.0.0.0");
    console.log(`Application is running on: http://localhost:${port}`);

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM signal received: closing HTTP server");
      await app.close();
      console.log("HTTP server closed");
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT signal received: closing HTTP server");
      await app.close();
      console.log("HTTP server closed");
    });
  } catch (error) {
    console.error("Error starting the application:", error);
    process.exit(1);
  }
}
bootstrap();
