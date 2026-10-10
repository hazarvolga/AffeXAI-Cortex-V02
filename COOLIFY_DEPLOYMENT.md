# Affexai Coolify Deployment Guide

This guide details how to deploy Affexai (Monorepo with NestJS Backend & Next.js Frontend) using Coolify.

## Prerequisites

1.  A running Coolify instance.
2.  Access to this GitHub repository from Coolify.
3.  A PostgreSQL database (can be managed by Coolify or external).
4.  A Redis instance (can be managed by Coolify or external).

## Deployment Methods

### Option 1: Apps Only (Recommended - Using Existing Services)
Since you have already created `affex-db`, `affex-redis`, and `minio-shared` in Coolify, use this method.

1.  **Add New Resource**:
    -   Select **"Docker Compose"**.
    -   Repository: `Affexai-Oracle-Servers` (or your repo).
    -   Docker Compose File Path: `/docker-compose.apps.yml`.

2.  **Configure Environment Variables**:
    You must populate these variables in Coolify for the stack to connect to your existing services.

    **Backend Connection to DB & Redis:**
    -   `DATABASE_HOST`: `affex-db` (or the internal DNS/IP of your Postgres service)
    -   `DATABASE_PASSWORD`: (The password you set for `affex-db`)
    -   `REDIS_HOST`: `affex-redis` (or the internal DNS/IP of your Redis service)
    -   `REDIS_PASSWORD`: (The password you set for `affex-redis`)

    **MinIO Configuration:**
    -   `AWS_ACCESS_KEY_ID`: (MinIO User)
    -   `AWS_SECRET_ACCESS_KEY`: (MinIO Password)
    -   `AWS_ENDPOINT`: `http://minio-shared:9000` (Internal endpoint)
    -   `AWS_S3_BUCKET`: `affexai-media`
    -   `AWS_FORCE_PATH_STYLE`: `true`

    **SES (Email) Configuration:**
    -   `SES_ACCESS_KEY_ID`: (Your AWS SES Access Key)
    -   `SES_SECRET_ACCESS_KEY`: (Your AWS SES Secret)
    -   `SES_REGION`: `eu-central-1` (or your region)

    **App URL Configuration:**
    -   `FRONTEND_URL`: `https://your-affexai-domain.example`
    -   `NEXT_PUBLIC_APP_URL`: `https://your-affexai-domain.example`
    -   `NEXT_PUBLIC_API_URL`: `https://api.your-affexai-domain.example`
    -   `NEXT_PUBLIC_SOCKET_URL`: `https://api.your-affexai-domain.example`
    -   `JWT_SECRET`: (Generate a secure random string)

### Option 2: Full Stack (New Database & Redis)
Use this if you want to deploy fresh Databases and Redis containers alongside the apps.

1.  **Add New Resource**:
    -   Select **"Docker Compose"**.
    -   Docker Compose File Path: `/docker-compose.production.yml`.

2.  **Configure Variables**:
    -   Set `DATABASE_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`.
    -   Set App URLs as above.

## Deployment Steps (Common)

1.  **Domains**:
    After the initial configuration save, go to the Service settings.
    -   `backend`: Set domain to your AffeXAI Cortex API hostname.
    -   `frontend`: Set domain to your AffeXAI Cortex application hostname.

2.  **Deploy**:
    Click **Deploy**.

## Post-Deployment
The backend container is configured to run migrations automatically on start via `.coolify-deploy.sh` if you use the full stack.
**For Option 1 (Apps Only):**
Since `depends_on` logic for DBs might be different for external services, ensure your `affex-db` is running before deploying.
If migrations fail to run automatically, execute them manually in the backend terminal:
```bash
pnpm --filter affexai-backend typeorm:migration:run:prod
```
