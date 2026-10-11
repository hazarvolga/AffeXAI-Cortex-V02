# AffeXAI Cortex — Coolify Deployment

**Last updated:** 2026-10-10

**Repository:** `https://github.com/hazarvolga/AffeXAI-Cortex-V02`

**Compose file:** `/docker-compose.production.yml`

## Release policy

Deploy the current stack to a private staging hostname first. Do not promote it to the public production domains until the runtime checks below pass and the repository CI is green. The current V02 CI run is a release **NO-GO**: migration checks pass, but backend/frontend lint and the fail-closed production dependency audit fail. Gitleaks reports no tracked secret finding; the dependency audit still reports 0 critical and 22 high transitive findings.

## Production stack

The Compose stack owns these services:

| Service | Purpose | Persistent data | Readiness gate |
| --- | --- | --- | --- |
| `postgres` | PostgreSQL 16 with pgvector | `postgres_data` | `pg_isready` |
| `redis` | Password-protected Redis 7 with AOF | `redis_data` | authenticated `PING` |
| `qdrant` | Cortex vector storage | `qdrant_data` | `/readyz` |
| `cortex` | Tenant-scoped memory/embedding service | Qdrant | `/ready` |
| `migration` | One-shot TypeORM migration runner | PostgreSQL | exit code `0` |
| `backend` | NestJS API and WebSocket server | `uploads_data`, `backups_data` | `/api/health` |
| `frontend` | Next.js application | none | `/api/health` |

`backend` starts only after PostgreSQL, Redis and Cortex are healthy and the one-shot migration service finishes successfully. `frontend` starts only after the backend is healthy. PostgreSQL, Redis, Qdrant and Cortex must remain private; publish only the frontend and backend through Coolify's proxy.

## Required Coolify variables

Copy `.env.production.template` into Coolify's environment-variable editor and replace every placeholder. Keep every password/key independent and store real values only in Coolify.

Required secrets:

- `DATABASE_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY`
- `BACKUP_ENCRYPTION_KEY`
- `CORTEX_SERVICE_SECRET`
- `QDRANT_API_KEY`

Required names and public URLs:

```dotenv
DATABASE_USERNAME=affexai
DATABASE_NAME=affexai
APP_URL=https://api.staging.example.com
FRONTEND_URL=https://staging.example.com
CORS_ORIGINS=https://staging.example.com
NEXT_PUBLIC_API_URL=https://api.staging.example.com/api
NEXT_PUBLIC_SOCKET_URL=https://api.staging.example.com
NEXT_PUBLIC_APP_URL=https://staging.example.com
DB_LOGGING=false
```

`NEXT_PUBLIC_*` values are embedded during the frontend build, so a hostname change requires a rebuild. `PLATFORM_ADMIN_USER_IDS` may stay empty until the administrator account exists. `QDRANT_API_KEY` is mandatory and is enforced by the Qdrant server as well as its clients. AI-provider keys, Resend and S3/AWS variables are optional only when the corresponding feature is intentionally disabled; missing provider/storage/email configuration is not accepted as proof that those product flows work.

## Coolify setup

1. Create a new project/environment named for staging.
2. Add a **Docker Compose** resource from `hazarvolga/AffeXAI-Cortex-V02`, branch `main`, using `/docker-compose.production.yml`.
3. Disable automatic production promotion. Deploy explicit reviewed commits only.
4. Add the environment variables above. Never commit the generated values or paste them into logs/issues.
5. Attach the staging API hostname to `backend:9006` and the staging application hostname to `frontend:3000`. Enable TLS for both.
6. Confirm the five named volumes are persistent and included in the server backup policy.
7. Deploy and inspect the `migration` container first. A non-zero migration exit blocks the release; do not bypass it by enabling schema synchronization.
8. Wait for all dependency health checks, then verify the public endpoints and critical tenant flows.

## Staging acceptance

All checks must pass before a production-domain promotion:

```bash
curl --fail --silent https://api.staging.example.com/api/health
curl --fail --silent https://staging.example.com/api/health
```

Also verify in the Coolify network:

- Qdrant `/readyz` returns success.
- Cortex `/health` reports liveness and `/ready` reports model plus Qdrant readiness.
- The migration service completed with exit code `0`; a repeat deployment is migration-idempotent.
- Login, tenant isolation, RBAC denial, CRM, Forms submission/idempotency/outbox and Automation approval/dispatch work with staging data.
- WebSocket connection accepts the configured staging origin and rejects an unlisted origin.
- A backend/Cortex restart preserves PostgreSQL, Redis AOF, Qdrant, uploads and backup data.
- Logs contain no credentials, tokens, encryption keys or tenant data from another tenant.

Passing container health alone is not release acceptance.

## Backup and restore

Before every migration or image promotion:

1. Create and verify a PostgreSQL logical backup (`pg_dump` custom format) outside the application volume.
2. Snapshot `postgres_data`, `qdrant_data`, `redis_data`, `uploads_data` and `backups_data` through the host/provider backup system.
3. Record the deployed Git SHA, image identifiers, environment revision and migration result.
4. Test restoration in an isolated staging resource. A backup that has not been restored is not verified.

Keep `BACKUP_ENCRYPTION_KEY` in the secret store and in a separate recovery escrow. Losing it can make application backups unusable.

## Rollback

Application rollback uses Coolify's previously known-good Git SHA/image with the same persistent volumes. Do not roll back the database blindly: TypeORM migrations may be forward-only. If the new migration is incompatible, stop writes, restore the verified pre-deploy PostgreSQL/Qdrant/volume snapshots, then redeploy the matching application SHA. Re-run all health and tenant-isolation checks before reopening traffic.

Production promotion is allowed only after CI/security gates are green, staging acceptance is recorded, backups are verified and a rollback SHA is documented.
