# AffeXAI Database Connection Reference

## Docker Services

All services run in Docker containers:

| Service | Container Name | Host Port | Container Port | Status |
|---------|---------------|-----------|----------------|--------|
| PostgreSQL | `affexai-postgres` | 5434 | 5432 | ✅ Running |
| Redis | `affexai-redis` | 6380 | 6379 | ✅ Running |
| MinIO (S3) | `affexai-minio` | 9007 (API), 9008 (Console) | 9000, 9001 | ✅ Running |

## PostgreSQL Connection Details

**From Host Machine:**
```bash
Host: localhost
Port: 5434
Database: affexai_dev
Username: postgres
Password: postgres
```

**Direct Docker Exec:**
```bash
docker exec -i affexai-postgres psql -U postgres -d affexai_dev -c "YOUR_SQL_HERE"
```

**Example - Update Admin Role Permissions:**
```bash
docker exec -i affexai-postgres psql -U postgres -d affexai_dev -c "UPDATE roles SET permissions = '[\"users.view\",\"email.view\",\"cms.view\",\"settings.view\",\"tickets.view_all\"]'::jsonb WHERE name = 'admin';"
```

## Redis Connection Details

**From Host Machine:**
```bash
Host: localhost
Port: 6380
Password: (empty)
```

**Direct Docker Exec:**
```bash
docker exec -i affexai-redis redis-cli
```

## MinIO (S3) Connection Details

**From Host Machine:**
```bash
Endpoint: http://localhost:9007
Console: http://localhost:9008
Access Key: minioadmin
Secret Key: minioadmin
Bucket: affexai-media
Region: us-east-1
```

## Environment Files

- **Backend**: `apps/backend/.env`
- **Frontend**: `apps/frontend/.env.local` (if exists)

## Common Database Operations

### Check Roles Table
```bash
docker exec -i affexai-postgres psql -U postgres -d affexai_dev -c "SELECT id, name, \"displayName\", permissions FROM roles;"
```

### Check Users Table
```bash
docker exec -i affexai-postgres psql -U postgres -d affexai_dev -c "SELECT id, email, \"firstName\", \"lastName\", \"roleId\" FROM users;"
```

### Run Seed Script
```bash
cd apps/backend
pnpm run seed:users
```

## Notes

- Database name is `affexai_dev` (not `affexai`)
- Role entity uses `name` column (not `roleKey`)
- Permissions are stored as JSONB array
- All Docker containers are user-managed (not auto-started by dev.sh)
