# Sprint 8 — Audit & Activity Logging (Complete)

## Summary

Sprint 8 implements a comprehensive audit trail for all mutation operations across the system. A global `AuditInterceptor` automatically logs 30+ route actions (auth, user, admin, role, permission, session) to a MongoDB `auditlogs` collection. Both successful and failed requests are recorded with user identity, IP address, endpoint, status code, and request body (with sensitive fields redacted). Admins can view, filter, and export audit logs via dedicated endpoints.

---

## Files Created / Modified

### New — Audit Module (6 files)

| File | Purpose |
|------|---------|
| `src/modules/audit/audit.module.ts` | Module registration, exports AuditService + AuditInterceptor |
| `src/modules/audit/audit.service.ts` | Audit log CRUD, filtering, JSON/CSV export, action summary aggregation |
| `src/modules/audit/audit.controller.ts` | 5 admin endpoints under `/admin/audit-logs` |
| `src/modules/audit/audit.interceptor.ts` | Global interceptor — auto-logs 30+ mutation routes |
| `src/modules/audit/schemas/audit-log.schema.ts` | AuditLog MongoDB schema |
| `src/modules/audit/dto/audit-log-query.dto.ts` | Query DTO with 9 filter parameters |

### Modified

| File | Changes |
|------|---------|
| `src/app.module.ts` | Imported `AuditModule`, registered `AuditInterceptor` as global `APP_INTERCEPTOR` |

---

## Database Schema — AuditLog

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | ObjectId (ref User) | User who performed the action (null for unauthenticated) |
| `user_email` | String | Email of the user (for quick filtering without join) |
| `action` | String (required) | Action identifier (e.g. `auth.login`, `admin.user.create`) |
| `target_type` | String (required) | Resource type (e.g. `auth`, `user`, `role`, `permission`, `session`) |
| `target_id` | String | ID of the affected resource |
| `description` | String | Human-readable description of the action |
| `method` | String (enum) | HTTP method: `GET`, `POST`, `PATCH`, `PUT`, `DELETE` |
| `endpoint` | String | Request path (e.g. `/api/v1/admin/users/123`) |
| `status_code` | Number | HTTP response status code |
| `changes` | Object | `{ before?, after? }` — request body with sensitive fields redacted |
| `metadata` | Object | Additional data (e.g. error details for failed requests) |
| `ip_address` | String | Client IP address |
| `user_agent` | String | Raw user agent string |
| `created_at` | Date | Auto-generated timestamp |

**Indexes:** `user_id`, `action`, `target_type`, `target_id`, `created_at` (desc), compound `user_id + created_at`, compound `action + created_at`

---

## Existing Utils Used

| Util | Used For |
|------|----------|
| `ErrorEntity` + `HttpStatus` | Error responses in controller |
| `ResultEntity` | Success responses via global interceptor |

---

## API Endpoints (5)

Base URL: `http://localhost:3000/api/v1`

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | GET | `/admin/audit-logs` | `audit:read` | Paginated + filtered audit logs |
| 2 | GET | `/admin/audit-logs/summary` | `audit:read` | Action counts grouped by type |
| 3 | GET | `/admin/audit-logs/export/json` | `audit:read` | Export as JSON (max 10k records) |
| 4 | GET | `/admin/audit-logs/export/csv` | `audit:read` | Export as CSV file download |
| 5 | GET | `/admin/audit-logs/:id` | `audit:read` | Single audit log entry |

---

## Global Audit Interceptor — 30+ Tracked Routes

The `AuditInterceptor` is registered as a global `APP_INTERCEPTOR` in `app.module.ts`. It intercepts all non-GET requests, matches them against a route map, and logs the action.

### Auth Actions (8)

| Action | Route | Description |
|--------|-------|-------------|
| `auth.register` | `POST /auth/register` | User registered with email |
| `auth.login` | `POST /auth/login` | User logged in |
| `auth.logout` | `POST /auth/logout` | User logged out |
| `auth.forgot_password` | `POST /auth/forgot-password` | Password reset requested |
| `auth.reset_password` | `POST /auth/reset-password` | Password reset via token |
| `auth.2fa_enable` | `POST /auth/2fa/enable` | 2FA setup initiated |
| `auth.2fa_verify` | `POST /auth/2fa/verify` | 2FA enabled |
| `auth.2fa_disable` | `POST /auth/2fa/disable` | 2FA disabled |

### User Profile Actions (7)

| Action | Route | Description |
|--------|-------|-------------|
| `user.update_profile` | `PATCH /user/profile` | Profile updated |
| `user.update_email` | `PATCH /user/email` | Email changed |
| `user.update_phone` | `PATCH /user/phone` | Phone updated |
| `user.change_password` | `PATCH /user/password` | Password changed |
| `user.upload_avatar` | `POST /user/profile/avatar` | Avatar uploaded |
| `user.remove_avatar` | `DELETE /user/profile/avatar` | Avatar removed |
| `user.update_notifications` | `PATCH /user/notifications` | Notification preferences updated |

### Admin User Actions (10)

| Action | Route | Description |
|--------|-------|-------------|
| `admin.user.create` | `POST /admin/users` | Admin created user |
| `admin.user.update` | `PATCH /admin/users/:id` | Admin updated user |
| `admin.user.update_status` | `PATCH /admin/users/:id/status` | Admin changed user status |
| `admin.user.suspend` | `PATCH /admin/users/:id/suspend` | Admin suspended user |
| `admin.user.restore` | `PATCH /admin/users/:id/restore` | Admin restored user |
| `admin.user.reset_password` | `POST /admin/users/:id/reset-password` | Admin reset password |
| `admin.user.assign_roles` | `POST /admin/users/:id/roles` | Admin assigned roles |
| `admin.user.remove_roles` | `DELETE /admin/users/:id/roles` | Admin removed roles |
| `admin.user.soft_delete` | `DELETE /admin/users/:id/soft` | Admin soft-deleted user |
| `admin.user.hard_delete` | `DELETE /admin/users/:id` | Admin permanently deleted user |

### Role Actions (7)

| Action | Route | Description |
|--------|-------|-------------|
| `role.create` | `POST /roles` | Created role |
| `role.update` | `PATCH /roles/:id` | Updated role |
| `role.delete` | `DELETE /roles/:id` | Deleted role |
| `role.assign_permissions` | `POST /roles/:id/permissions` | Assigned permissions to role |
| `role.remove_permissions` | `DELETE /roles/:id/permissions` | Removed permissions from role |
| `role.assign_to_user` | `POST /roles/assign-to-user` | Assigned roles to user |
| `role.remove_from_user` | `POST /roles/remove-from-user` | Removed roles from user |

### Permission Actions (3)

| Action | Route | Description |
|--------|-------|-------------|
| `permission.create` | `POST /permissions` | Created permission |
| `permission.update` | `PATCH /permissions/:id` | Updated permission |
| `permission.delete` | `DELETE /permissions/:id` | Deleted permission |

### Session Actions (2)

| Action | Route | Description |
|--------|-------|-------------|
| `session.terminate` | `DELETE /sessions/:id` | Terminated specific session |
| `session.terminate_all` | `DELETE /sessions` | Terminated all sessions |

---

## Filter Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | Number | Page number (default: 1) | `1` |
| `limit` | Number | Items per page (default: 20, max: 100) | `50` |
| `user_id` | ObjectId | Filter by user who performed action | `507f1f77bcf86cd799439011` |
| `user_email` | String | Filter by email (case-insensitive regex) | `admin@example.com` |
| `action` | String | Filter by action (case-insensitive regex) | `auth.login` or `admin.user` |
| `target_type` | String | Filter by target resource type | `user`, `role`, `auth` |
| `target_id` | String | Filter by affected resource ID | `507f1f77bcf86cd799439011` |
| `date_from` | String | From date (inclusive) | `2026-03-01` |
| `date_to` | String | To date (inclusive, end of day) | `2026-03-31` |
| `method` | String | Filter by HTTP method | `POST`, `DELETE` |

---

## Security Features

### Sensitive Field Redaction

Request bodies are stored in the `changes.after` field, but sensitive values are automatically replaced with `[REDACTED]`:

```
password_hash, password, new_password, current_password,
two_fa_secret, email_verification_token, password_reset_token,
token_hash, refresh_token, access_token, token,
client_secret, client_id
```

**Example stored changes:**
```json
{
  "after": {
    "email": "user@example.com",
    "password": "[REDACTED]",
    "first_name": "John"
  }
}
```

### Failed Request Logging

Failed requests (errors, validation failures, 403/401) are also logged with a `[FAILED]` prefix in the description and error details in `metadata`:

```json
{
  "action": "auth.login",
  "description": "[FAILED] User logged in with email hacker@example.com",
  "status_code": 401,
  "metadata": {
    "error": "Invalid credentials"
  }
}
```

### Non-blocking Writes

Audit log writes are fire-and-forget — they don't block or slow down API responses. If a write fails, the error is caught and logged to console without affecting the request.

---

## How to Test

### Prerequisites

1. Start MongoDB + run `npm run start:dev`
2. Login as admin/super_admin user (needs `audit:read` permission)
3. Save the `access_token`

---

### Step 1: Generate Audit Data

Perform some actions to generate audit logs:

```bash
# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Audit",
    "last_name": "Test",
    "email": "audit@example.com",
    "password": "AuditTest123"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourAdminPassword",
    "remember_me": false
  }'

# Update a profile
curl -X PATCH http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "first_name": "UpdatedName" }'
```

---

### Step 2: View Audit Logs (Paginated)

```bash
# Default — page 1, 20 per page
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — logs array + `meta_data` with pagination

```json
{
  "success": true,
  "code": 200,
  "data": {
    "logs": [
      {
        "_id": "...",
        "user_id": "...",
        "user_email": "admin@example.com",
        "action": "user.update_profile",
        "target_type": "user",
        "target_id": "...",
        "description": "User updated their profile",
        "method": "PATCH",
        "endpoint": "/api/v1/user/profile",
        "status_code": 200,
        "changes": {
          "after": { "first_name": "UpdatedName" }
        },
        "ip_address": "::1",
        "user_agent": "curl/8.0",
        "created_at": "2026-03-13T..."
      }
    ],
    "meta_data": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "total_pages": 1
    }
  }
}
```

---

### Step 3: Filter by Action

```bash
# All login attempts
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?action=auth.login" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# All admin user actions
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?action=admin.user" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### Step 4: Filter by User

```bash
# By user ID
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?user_id=<USER_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# By user email
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?user_email=admin@example.com" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### Step 5: Filter by Target Type

```bash
# All role-related actions
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?target_type=role" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# All auth-related actions
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?target_type=auth" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### Step 6: Filter by Date Range

```bash
# This week
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?date_from=2026-03-10&date_to=2026-03-13" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### Step 7: Filter by HTTP Method

```bash
# All DELETE operations
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?method=DELETE" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# All POST operations
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?method=POST" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### Step 8: Combined Filters

```bash
# Admin user deletions in March 2026
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?action=admin.user&method=DELETE&date_from=2026-03-01&date_to=2026-03-31" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### Step 9: Action Summary

```bash
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs/summary" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Action counts grouped by type

```json
{
  "success": true,
  "code": 200,
  "data": [
    { "_id": "auth.login", "count": 25, "last_at": "2026-03-13T..." },
    { "_id": "auth.register", "count": 10, "last_at": "2026-03-13T..." },
    { "_id": "user.update_profile", "count": 8, "last_at": "2026-03-13T..." },
    { "_id": "admin.user.create", "count": 3, "last_at": "2026-03-12T..." }
  ]
}
```

---

### Step 10: Export as JSON

```bash
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs/export/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# With filters
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs/export/json?target_type=auth&date_from=2026-03-01" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — JSON with total, exported_at, and full logs array (max 10k)

```json
{
  "success": true,
  "code": 200,
  "data": {
    "total": 50,
    "exported_at": "2026-03-13T...",
    "logs": [...]
  }
}
```

---

### Step 11: Export as CSV

```bash
# Download CSV file
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs/export/csv" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -o audit-logs.csv

# With filters
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs/export/csv?action=auth.login" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -o login-audit.csv
```

**Expected:** CSV file download with headers:

```
id,user_id,user_email,action,target_type,target_id,description,method,endpoint,status_code,ip_address,created_at
```

---

### Step 12: Get Single Log Entry

```bash
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs/<LOG_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Full audit log entry with all fields including `changes` and `metadata`

---

### Step 13: Verify Failed Request Logging

```bash
# Attempt login with wrong password
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "WrongPassword",
    "remember_me": false
  }'

# Check audit logs for failed entry
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?action=auth.login" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** Log entry with `[FAILED]` in description, error details in `metadata`

---

### Step 14: Verify Sensitive Field Redaction

```bash
# Create a user (body contains password)
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Redact",
    "last_name": "Test",
    "email": "redact@example.com",
    "password": "SecretPass123"
  }'

# Check the audit log
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs?action=admin.user.create" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `changes.after.password` shows `[REDACTED]`, not the actual password

---

### Step 15: Test Permission Enforcement

```bash
# Login as regular user (no audit:read permission)
curl -X GET "http://localhost:3000/api/v1/admin/audit-logs" \
  -H "Authorization: Bearer <REGULAR_USER_TOKEN>"
```

**Expected:** `403` — `insufficient_permission`

---

## Useful MongoDB Queries

```javascript
// ── View all audit logs ──
db.auditlogs.find().sort({ created_at: -1 }).limit(20)

// ── View logs for a specific user ──
db.auditlogs.find({ user_id: ObjectId("<USER_ID>") }).sort({ created_at: -1 })

// ── View all failed actions ──
db.auditlogs.find({ description: /\[FAILED\]/ }).sort({ created_at: -1 })

// ── View all login attempts ──
db.auditlogs.find({ action: "auth.login" }).sort({ created_at: -1 })

// ── View all admin actions ──
db.auditlogs.find({ action: /^admin\./ }).sort({ created_at: -1 })

// ── View all DELETE operations ──
db.auditlogs.find({ method: "DELETE" }).sort({ created_at: -1 })

// ── Count actions by type ──
db.auditlogs.aggregate([
  { $group: { _id: "$action", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// ── Count actions by user ──
db.auditlogs.aggregate([
  { $group: { _id: "$user_email", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// ── Find actions on a specific resource ──
db.auditlogs.find({ target_id: "<RESOURCE_ID>" }).sort({ created_at: -1 })

// ── Date range query ──
db.auditlogs.find({
  created_at: {
    $gte: ISODate("2026-03-01"),
    $lte: ISODate("2026-03-31")
  }
}).sort({ created_at: -1 })

// ── Collection size ──
db.auditlogs.estimatedDocumentCount()
```

---

## Architecture

### Interceptor Flow

```
Request → Guards (JWT, Roles, Permissions)
        → AuditInterceptor (captures method, url, user, ip, body)
        → Route Handler (controller → service)
        → Response
        ↓
    AuditInterceptor.tap()
        → on success: log with status_code, response data
        → on error: log with error status, error message
        → AuditService.log() (non-blocking, fire-and-forget)
```

### What Gets Logged vs Skipped

| Logged | Skipped |
|--------|---------|
| All POST requests (create, login, register) | All GET requests (reads) |
| All PATCH requests (updates) | Health check (`GET /`) |
| All PUT requests (updates) | Swagger UI (`GET /api-docs`) |
| All DELETE requests (deletes) | Unmapped routes (non-matching patterns) |
| Both success and failure | |

### Route Matching

The interceptor uses a static `AUDIT_MAP` array of regex patterns. Each entry defines:
- **pattern** — regex matching `METHOD /path`
- **action** — dot-notation action identifier (e.g. `admin.user.create`)
- **target_type** — resource category (`auth`, `user`, `role`, `permission`, `session`)
- **description** — function that generates human-readable text from params and body

Routes not in the map are silently skipped (no audit log created).

---

## Sprint 8 Task Completion

| # | Task | Status |
|---|------|--------|
| 1 | Audit log schema & service | ✅ AuditLog schema + AuditService |
| 2 | Log user login/logout | ✅ `auth.login`, `auth.logout` |
| 3 | Log user creation/update/deletion | ✅ `user.*`, `admin.user.*` (10 actions) |
| 4 | Log role changes | ✅ `role.*` (7 actions) |
| 5 | Log permission changes | ✅ `permission.*` (3 actions) |
| 6 | Log password reset | ✅ `auth.reset_password`, `admin.user.reset_password` |
| 7 | View audit logs (paginated) | ✅ `GET /admin/audit-logs` |
| 8 | Filter audit logs (user, action, date) | ✅ 9 filter parameters |
| 9 | Export audit logs (CSV/JSON) | ✅ `GET /admin/audit-logs/export/json` + `/csv` |

---

## Swagger UI

After starting the app, visit: `http://localhost:3000/api-docs`

New section: **Admin - Audit Logs** — 5 endpoints for viewing, filtering, and exporting audit trail data.

All require Bearer token + `audit:read` permission (super_admin, admin, moderator roles have this by default).
