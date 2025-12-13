# ToolJet PostgreSQL and PostgREST Setup Guide

This guide provides step-by-step instructions to set up PostgreSQL and PostgREST for ToolJet development on a new machine, avoiding common pitfalls.

## Prerequisites

- Docker Desktop installed and running
- Node.js installed (v18+ recommended)
- Git (to clone the repository)

## Overview

ToolJet uses:
- **PostgreSQL 13** for database storage (runs in Docker)
- **PostgREST v12.0.2** as a REST API layer for the internal database (runs in Docker)
- **ToolJet Server** (Node.js/NestJS) on localhost:3000
- **ToolJet Frontend** (React) on localhost:8082

## Step 1: Clone Repository

```powershell
cd B:\
git clone https://github.com/ToolJet/ToolJet.git
cd ToolJet
```

## Step 2: Create Environment File

Create a `.env` file in the root directory (`B:\ToolJet\.env`) with the following content:

```env
# -----------------------
# BASIC TOOLJET SETTINGS
# -----------------------
TOOLJET_HOST=http://localhost:8082
LOCKBOX_MASTER_KEY=0000000000000000000000000000000000000000000000000000000000000000
SECRET_KEY_BASE=my_local_secret_key_12345
SERVER_HOST=localhost

# -----------------------
# DATABASE CONFIG
# Main Postgres (App Data)
# -----------------------
ORM_LOGGING=false
PG_DB=tooljet_main
PG_USER=tooljet
PG_PASS=tooljet
PG_HOST=tooljet-db

# -----------------------
# TOOLJET INTERNAL DATABASE (System / Meta)
# -----------------------
TOOLJET_DB=tooljet_internal
TOOLJET_DB_USER=tooljet
TOOLJET_DB_PASS=tooljet
TOOLJET_DB_HOST=localhost
TOOLJET_DB_RECONFIG=true
TOOLJET_DB_STATEMENT_TIMEOUT=60000

# -----------------------
# POSTGREST CONFIG (Required for ToolJet Database feature)
# -----------------------
PGRST_HOST=http://localhost:3002
PGRST_DB_URI=postgres://tooljet:tooljet@tooljet-db:5432/tooljet_internal
PGRST_JWT_SECRET=a079bb63e2c3fc109b522a817a44ebd03a2f19c18fb7f23e77c6b6c8de7c68c6
PGRST_DB_PRE_CONFIG=postgrest.pre_config
PGRST_SERVER_PORT=3002

# -----------------------
# MISC SETTINGS
# -----------------------
CHECK_FOR_UPDATES=false
ENABLE_MULTIPLAYER_EDITING=true
ENABLE_CORS=true

# Email / SMTP (disabled in local dev)
DEFAULT_FROM_EMAIL=hello@tooljet.io
SMTP_DISABLED=true

# Disable user signups (optional)
DISABLE_SIGNUPS=false

# Observability (disabled for local)
APM_VENDOR=
SENTRY_DNS=
SENTRY_DEBUG=

# SSO (not needed locally)
SSO_GOOGLE_OAUTH2_CLIENT_ID=
SSO_GIT_OAUTH2_CLIENT_ID=
SSO_GIT_OAUTH2_CLIENT_SECRET=
SSO_GIT_OAUTH2_HOST=
SSO_ACCEPTED_DOMAINS=
SSO_DISABLE_SIGNUPS=

# Onboarding + session controls
ENABLE_ONBOARDING_QUESTIONS_FOR_ALL_SIGN_UPS=false
USER_SESSION_EXPIRY=120

# App embed controls
DISABLE_APP_EMBED=false
ENABLE_PRIVATE_APP_EMBED=true

# Cloud (ignore for local)
ORGANIZATION_LICENSE_URL=
ORGANIZATION_LICENSE_API_KEY=

# PAT tokens
PAT_SESSION_EXPIRY=60
PAT_EXPIRY=30
```

### ⚠️ CRITICAL: JWT Secret Configuration

**The `PGRST_JWT_SECRET` must be the same in both the `.env` file and the PostgREST container.** If they don't match, you'll get `JWSError JWSInvalidSignature` errors.

To generate a new JWT secret (optional, if starting fresh):

```powershell
# Generate a random 64-character hex string
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

Replace the `PGRST_JWT_SECRET` value in your `.env` file with the generated string.

## Step 3: Update docker-compose.yaml

**Important:** The default `docker-compose.yaml` may use `${PG_HOST}` variable for the PostgreSQL container name, which causes issues. You need to hardcode it to `tooljet-db`.

Open `B:\ToolJet\docker-compose.yaml` and find the PostgreSQL service (around line 73):

```yaml
postgres:
  container_name: tooljet-db  # ✅ MUST be hardcoded to "tooljet-db"
  image: postgres:13
  restart: always
  ports:
    - 5432:5432
  volumes:
    - postgres:/data/postgres
  env_file: .env
  environment:
    - POSTGRES_DB=${PG_DB}
    - POSTGRES_USER=${PG_USER}
    - POSTGRES_PASSWORD=${PG_PASS}
```

Also verify the PostgREST service configuration (around line 58):

```yaml
postgrest:
  container_name: postgrest
  image: postgrest/postgrest:v12.0.2
  ports:
    - "3002:3002"
  environment:
    - PGRST_DB_URI=postgres://${TOOLJET_DB_USER}:${TOOLJET_DB_PASS}@tooljet-db:5432/${TOOLJET_DB}
    - PGRST_JWT_SECRET=${PGRST_JWT_SECRET}
    - PGRST_DB_PRE_CONFIG=postgrest.pre_config
    - PGRST_SERVER_PORT=3002
  depends_on:
    - postgres
```

**Key Points:**
- PostgreSQL container must be named `tooljet-db` (not `${PG_HOST}` or `localhost`)
- PostgREST connects using `@tooljet-db:5432` (Docker internal hostname)
- Both containers must be on the same Docker network (handled automatically by docker-compose)

## Step 4: Start PostgreSQL and PostgREST

```powershell
# Navigate to ToolJet directory
cd B:\ToolJet

# Start only the database services
docker-compose up -d postgres postgrest

# Verify containers are running
docker ps
```

You should see two containers:
- `tooljet-db` (postgres:13) on port 5432
- `postgrest` (postgrest/postgrest:v12.0.2) on port 3002

### Check PostgREST Logs

```powershell
docker logs postgrest
```

Expected output:
```
Listening on port 3002
Schema cache loaded
```

If you see errors, check:
1. PostgreSQL is running: `docker logs tooljet-db`
2. JWT secret is set: `docker exec postgrest env | grep PGRST_JWT_SECRET`
3. Database URI is correct: `docker exec postgrest env | grep PGRST_DB_URI`

## Step 5: Install Dependencies

```powershell
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install frontend dependencies (if running locally)
cd ../frontend
npm install
```

## Step 6: Run Database Migrations

```powershell
# Navigate to server directory
cd B:\ToolJet\server

# Run migrations to set up database schema
npm run db:migrate

# Seed initial data (if needed)
npm run db:seed
```

## Step 7: Start ToolJet Server

```powershell
cd B:\ToolJet\server
npm start
```

Wait for the server to start. You should see:

```
🚀 TOOLJET APPLICATION STARTED SUCCESSFULLY
Edition: ce
Version: 3.16.1-ce-lts
Host: http://localhost:8082
Port: 3000
```

## Step 8: Start Frontend (Optional)

If you want to run the frontend dev server separately:

```powershell
cd B:\ToolJet\frontend
npm start
```

Frontend will be available at http://localhost:8082

## Troubleshooting

### Issue: `JWSError JWSInvalidSignature` when accessing database tables

**Cause:** JWT secret mismatch between ToolJet server and PostgREST.

**Solution:**
1. Stop PostgREST: `docker stop postgrest && docker rm postgrest`
2. Verify `.env` has `PGRST_JWT_SECRET` set correctly
3. Restart PostgREST: `docker-compose up -d postgrest`
4. Restart ToolJet server (Ctrl+C in server terminal, then `npm start`)

### Issue: PostgREST can't connect to database

**Cause:** Incorrect database URI or container name.

**Solution:**
1. Verify `docker-compose.yaml` uses `@tooljet-db:5432` (not `@localhost:5432` or `@${PG_HOST}:5432`)
2. Ensure PostgreSQL container name is `tooljet-db`
3. Recreate containers: `docker-compose down && docker-compose up -d postgres postgrest`

### Issue: PostgreSQL connection refused from host machine

**Cause:** Using Docker internal hostname on host machine.

**Solution:**
- ToolJet server `.env` should use `TOOLJET_DB_HOST=localhost` (connects from host)
- PostgREST should use `@tooljet-db:5432` in URI (connects within Docker network)

### Verify JWT Secret Match

```powershell
# Check .env file secret
Get-Content B:\ToolJet\.env | Select-String "PGRST_JWT_SECRET"

# Check PostgREST container secret
docker exec postgrest env | grep PGRST_JWT_SECRET

# They MUST match exactly
```

### Generate New JWT Secret (if needed)

```powershell
# Generate new secret
$newSecret = -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
Write-Host $newSecret

# Update .env file manually with the new secret
# Then recreate PostgREST:
docker stop postgrest
docker rm postgrest
docker-compose up -d postgrest

# Restart server to load new secret
cd B:\ToolJet\server
npm start
```

## Common Mistakes to Avoid

1. ❌ **Using `PG_HOST=localhost` in `.env` AND expecting container name to be `localhost`**
   - ✅ Use `PG_HOST=tooljet-db` or hardcode container name in docker-compose.yaml

2. ❌ **Mismatched JWT secrets between `.env` and PostgREST container**
   - ✅ Always verify both match after any changes

3. ❌ **Not restarting server after changing `.env`**
   - ✅ Server caches environment variables - must fully restart (Ctrl+C, then `npm start`)

4. ❌ **Using `localhost` in PostgREST database URI**
   - ✅ PostgREST runs in Docker - must use container name `tooljet-db`

5. ❌ **Forgetting to run database migrations**
   - ✅ Always run `npm run db:migrate` in server directory after fresh setup

## Quick Reference Commands

```powershell
# Check running containers
docker ps

# View PostgREST logs
docker logs postgrest -f

# View PostgreSQL logs
docker logs tooljet-db -f

# Restart PostgREST
docker restart postgrest

# Reset everything (WARNING: deletes data)
docker-compose down -v
docker-compose up -d postgres postgrest
cd server && npm run db:migrate

# Check server is using correct JWT secret
cd B:\ToolJet\server
node -e "require('dotenv').config({path:'../.env'}); console.log('JWT Secret:', process.env.PGRST_JWT_SECRET);"
```

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Host Machine                         │
│                                                              │
│  ┌────────────────────┐      ┌──────────────────────┐      │
│  │  ToolJet Server    │      │  ToolJet Frontend    │      │
│  │  localhost:3000    │◄────►│  localhost:8082      │      │
│  │  (Node.js/NestJS)  │      │  (React/Webpack)     │      │
│  └─────────┬──────────┘      └──────────────────────┘      │
│            │                                                 │
│            │ PGRST_HOST=http://localhost:3002                │
│            │ TOOLJET_DB_HOST=localhost                       │
│            │                                                 │
│            ▼                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Docker Network (tooljet_default)          │   │
│  │                                                      │   │
│  │  ┌────────────────┐      ┌─────────────────────┐   │   │
│  │  │   PostgreSQL   │◄────►│    PostgREST        │   │   │
│  │  │   tooljet-db   │      │    postgrest        │   │   │
│  │  │   :5432        │      │    :3002            │   │   │
│  │  └────────────────┘      └─────────────────────┘   │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│            ▲                          ▲                     │
│            │                          │                     │
│            │ Port Mapping             │ Port Mapping        │
│            │ 5432:5432                │ 3002:3002           │
└────────────┼──────────────────────────┼─────────────────────┘
             │                          │
     localhost:5432            localhost:3002
```

## Success Indicators

✅ **All systems running correctly when you see:**

1. PostgreSQL: `docker logs tooljet-db` shows "database system is ready to accept connections"
2. PostgREST: `docker logs postgrest` shows "Listening on port 3002" and "Schema cache loaded"
3. Server: Terminal shows "🚀 TOOLJET APPLICATION STARTED SUCCESSFULLY" and "Port: 3000"
4. Browser: http://localhost:8082 loads without errors, database tables display data

## Next Steps

After setup is complete:
1. Create a user account at http://localhost:8082/signup
2. Create a workspace
3. Test the ToolJet Database feature by creating a table
4. Verify no JWT signature errors in browser console (F12)

## References

- [ToolJet Documentation](https://docs.tooljet.com/)
- [PostgREST Documentation](https://postgrest.org/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
