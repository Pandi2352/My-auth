# NestJS MongoDB User Management System

A production-ready, enterprise-grade user management system built with **NestJS 11**, **MongoDB/Mongoose 9**, and **TypeScript**. Designed as a reusable boilerplate for any application that needs authentication, authorization, and user administration.

---

## Features

### Authentication & Security
- JWT access + refresh token authentication
- Email verification with token-based flow
- Password reset via email
- Two-factor authentication (TOTP — Google Authenticator, Authy)
- Social OAuth2 login (Google, GitHub, Facebook, Microsoft, LinkedIn, Twitter, Apple)
- Admin-configurable social connectors (enable/disable providers at runtime)
- Account lockout after failed login attempts
- Rate limiting (throttle guard)

### User Management
- Self-service profile (update name, email, phone, avatar, password)
- Avatar upload with image validation
- Notification preferences
- Admin CRUD (create, list, search, update, suspend, delete users)
- Soft delete with restore capability
- Admin password reset for users

### Role-Based Access Control (RBAC)
- Permissions with `module:action` slugs (e.g., `user:read`, `role:update`)
- Roles with assigned permissions
- 4 seeded roles: Super Admin, Admin, Moderator, User
- `@Permissions()` and `@Roles()` decorators with global guards
- User groups with role inheritance

### Enterprise Features
- **Audit Logging** — Auto-tracks 60+ mutation routes with user, IP, method, status
- **Analytics Dashboard** — User growth, login activity, role distribution, status breakdown
- **System Configuration** — Key-value config store with 19 auto-seeded defaults across 4 categories
- **Invitation System** — Admin sends invite emails, role-based invitations, token validation
- **API Key Management** — Create, revoke, delete keys with prefix-based lookup and bcrypt hashing
- **GDPR Compliance** — Data export, account deletion with PII anonymization, account recovery
- **Admin Impersonation** — Debug as any user with full audit trail
- **Session Management** — View active sessions, terminate individual or all sessions

### Developer Experience
- Swagger/OpenAPI docs at `/api-docs`
- Winston structured logging (JSON in production, colorized in development)
- File-based log rotation (error.log + combined.log)
- Docker + Docker Compose for one-command setup
- Health check endpoints (liveness + readiness probes)
- Unified response format via `ResultEntity` / `ErrorEntity`
- Global exception filter with consistent error shape

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| Language | TypeScript 5 (nodenext modules) |
| Database | MongoDB 7 + Mongoose 9 |
| Auth | JWT (access + refresh), Passport, TOTP |
| Email | Nodemailer + 10 HTML email templates |
| Docs | Swagger / OpenAPI 3 |
| Logging | Winston 3 |
| Validation | class-validator + class-transformer |
| File Upload | Multer |
| Rate Limit | @nestjs/throttler |
| Container | Docker + Docker Compose |

---

## Quick Start

### Option 1 — Docker (recommended)

```bash
# Clone the repo
git clone <repo-url>
cd nestjs-mongodb-setup-utils

# Start everything (app + MongoDB)
docker compose up -d

# App runs at http://localhost:3000
# Swagger at http://localhost:3000/api-docs
```

### Option 2 — Local Development

**Prerequisites:** Node.js 20+, MongoDB 6+

```bash
# Install dependencies
npm install

# Create environment file
cp .env.development .env.development.local
# Edit .env.development.local with your settings

# Start MongoDB (if not already running)
mongod

# Run in development mode
npm run start:dev
```

The application will:
1. Connect to MongoDB
2. Seed permissions (30+), roles (4), and system configs (19)
3. Start listening on port 3000
4. Swagger docs available at `http://localhost:3000/api-docs`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment (development/production) |
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection URI |
| `MONGODB_DB_NAME` | `nestjs_app` | Database name |
| `JWT_ACCESS_SECRET` | — | Secret for access tokens |
| `JWT_REFRESH_SECRET` | — | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `SMTP_HOST` | — | SMTP server host |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` | `noreply@app.com` | From email address |
| `FRONTEND_URL` | `http://localhost:4200` | Frontend URL (for email links and OAuth redirects) |
| `SWAGGER_ENABLED` | `true` | Enable Swagger docs |
| `SWAGGER_PATH` | `api-docs` | Swagger endpoint path |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) | Winston log level |

---

## Project Structure

```
src/
├── app.module.ts                  # Root module — 16 feature modules
├── main.ts                        # Bootstrap with Winston logger
├── config/
│   ├── database.config.ts         # MongoDB connection config
│   ├── jwt.config.ts              # JWT secrets and expiry
│   └── swagger.config.ts          # Swagger/OpenAPI setup
├── common/
│   ├── decorators/                # @Public, @CurrentUser, @Permissions, @Roles
│   ├── guards/                    # JwtAuthGuard, RolesGuard, PermissionsGuard
│   ├── filters/                   # GlobalExceptionFilter
│   ├── interceptors/              # ResponseInterceptor
│   ├── enums/                     # PermissionAction enum
│   ├── logger/                    # WinstonLoggerService
│   └── utils/                     # BcryptPasswordHelper, UserAgentHelper, IPToLocation
└── modules/
    ├── auth/                      # Register, login, 2FA, password reset, recovery
    ├── user/                      # Profile, admin CRUD, GDPR endpoints
    ├── permission/                # Permission schema & service
    ├── role/                      # Role schema & service
    ├── seed/                      # Auto-seed permissions + roles on startup
    ├── admin/                     # Admin user management controller
    ├── session/                   # Session management + security events
    ├── audit/                     # Audit log interceptor + query/export
    ├── analytics/                 # Dashboard aggregation pipelines
    ├── group/                     # User groups with role inheritance
    ├── system-config/             # Key-value system configuration
    ├── invitation/                # Email invitations with token flow
    ├── api-key/                   # API key management (bcrypt hashed)
    ├── social-auth/               # OAuth2 multi-connector system
    ├── notification/              # Email service + 10 HTML templates
    └── health/                    # Liveness + readiness probes
```

---

## API Overview

**100+ endpoints across 16 modules**

| Module | Base Path | Endpoints | Auth |
|--------|-----------|-----------|------|
| Health | `/api/v1/health` | 2 | Public |
| Auth | `/api/v1/auth` | 15 | Mixed |
| User Profile | `/api/v1/user` | 10 | Bearer + Permissions |
| Admin Users | `/api/v1/admin/users` | 13 | Bearer + Permissions |
| Sessions | `/api/v1/sessions` | 3 | Bearer + Permissions |
| Security | `/api/v1/security` | 2 | Bearer + Permissions |
| Groups | `/api/v1/admin/groups` | 10 | Bearer + Permissions |
| System Config | `/api/v1/admin/settings` | 7 | Bearer + Permissions |
| Invitations | `/api/v1/admin/invitations` | 6 | Bearer + Permissions |
| API Keys | `/api/v1/user/api-keys` | 5 | Bearer + Permissions |
| Audit Logs | `/api/v1/admin/audit-logs` | 5 | Bearer + Permissions |
| Analytics | `/api/v1/admin/analytics` | 8 | Bearer + Permissions |
| Social Connectors | `/api/v1/admin/social-connectors` | 6 | Bearer + Permissions |
| Social Auth | `/api/v1/auth/social` | 7 | Mixed |

Full testing guide: [`docs/MANUAL-TESTING-GUIDE.md`](docs/MANUAL-TESTING-GUIDE.md)

---

## Health Checks

```bash
# Liveness — is the app running?
GET /api/v1/health

# Readiness — is the app connected to all dependencies?
GET /api/v1/health/ready
```

**Liveness response:**
```json
{
  "status": "ok",
  "uptime_seconds": 3600,
  "uptime_human": "1h 0m 0s",
  "environment": "production",
  "node_version": "v20.11.0",
  "memory": {
    "rss_mb": 85.32,
    "heap_used_mb": 42.15,
    "heap_total_mb": 65.00,
    "external_mb": 2.10
  }
}
```

**Readiness response:**
```json
{
  "status": "ready",
  "checks": {
    "mongodb": { "status": "up", "latency_ms": 3 }
  }
}
```

---

## Logging

Uses **Winston** with environment-aware configuration:

| Environment | Output | Format |
|-------------|--------|--------|
| Development | Console only | Colorized, human-readable |
| Production | Console + File | Structured JSON |

**Production log files:**
- `logs/error.log` — Errors only (10MB rotation, 5 files)
- `logs/combined.log` — All logs (10MB rotation, 10 files)

Set log level via `LOG_LEVEL` env var: `error`, `warn`, `info`, `debug`, `verbose`.

---

## Docker

### Build & Run

```bash
# Build image
docker build -t nestjs-user-mgmt .

# Run with docker compose (app + MongoDB)
docker compose up -d

# View logs
docker compose logs -f app

# Stop everything
docker compose down

# Stop and remove volumes (reset database)
docker compose down -v
```

### Production Deployment

```bash
# Override environment variables
MONGO_ROOT_USER=produser \
MONGO_ROOT_PASS=securepassword \
JWT_ACCESS_SECRET=your-prod-secret \
JWT_REFRESH_SECRET=your-prod-refresh-secret \
docker compose up -d
```

---

## Seeded Data

On first startup, the following data is automatically created:

**Permissions (30+):** Across 10 modules — `user:create`, `user:read`, `role:update`, `settings:read`, etc.

**Roles (4):**

| Role | Slug | Permissions |
|------|------|-------------|
| Super Admin | `super_admin` | All permissions |
| Admin | `admin` | All except `settings:update` |
| Moderator | `moderator` | User/group read+update, session/audit read |
| User | `user` | Self-service (user read+update, session read+delete) |

**System Configs (19):** Across 4 categories — `app`, `auth`, `email`, `security`.

---

## Scripts

```bash
npm run start:dev      # Development with hot reload
npm run start:prod     # Production
npm run build          # Compile TypeScript
npm run lint           # ESLint
npm run format         # Prettier
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report
```

---

## License

UNLICENSED — Private project.
