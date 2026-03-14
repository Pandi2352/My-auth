# Sprint 10 — Enterprise & System Configuration (Complete)

## Summary

Sprint 10 adds enterprise-grade features: **System Configuration** (key-value settings store with 19 seeded defaults across 4 categories), **User Invitations** (email-based invite flow with role assignment, 7-day expiry, resend/revoke), **API Key Management** (per-user keys with permission scoping, bcrypt-hashed, prefix-based validation), **GDPR Compliance** (data export + account deletion with PII anonymization), **Account Recovery** (recover soft-deleted accounts via email token), and **Admin Impersonation** (short-lived tokens with full audit logging). All features are integrated with the audit interceptor (15 new tracked routes) and permission system.

---

## Files Created / Modified

### New — System Config Module (5 files)

| File | Purpose |
|------|---------|
| `src/modules/system-config/system-config.module.ts` | Module registration, exports SystemConfigService |
| `src/modules/system-config/system-config.service.ts` | CRUD + bulk update + auto-seed 19 defaults on startup |
| `src/modules/system-config/system-config.controller.ts` | 7 endpoints under `/admin/settings` |
| `src/modules/system-config/schemas/system-config.schema.ts` | SystemConfig MongoDB schema |
| `src/modules/system-config/dto/update-config.dto.ts` | CreateConfigDto + UpdateConfigDto |

### New — Invitation Module (5 files)

| File | Purpose |
|------|---------|
| `src/modules/invitation/invitation.module.ts` | Module registration, imports User/Role/Notification |
| `src/modules/invitation/invitation.service.ts` | Create, list, validate, accept, revoke, resend |
| `src/modules/invitation/invitation.controller.ts` | 5 admin endpoints + 1 public validation endpoint |
| `src/modules/invitation/schemas/invitation.schema.ts` | Invitation MongoDB schema |
| `src/modules/invitation/dto/create-invitation.dto.ts` | CreateInvitationDto (email + optional role_id) |

### New — API Key Module (5 files)

| File | Purpose |
|------|---------|
| `src/modules/api-key/api-key.module.ts` | Module registration, exports ApiKeyService |
| `src/modules/api-key/api-key.service.ts` | Generate, validate, revoke, delete keys |
| `src/modules/api-key/api-key.controller.ts` | 5 endpoints under `/user/api-keys` |
| `src/modules/api-key/schemas/api-key.schema.ts` | ApiKey MongoDB schema |
| `src/modules/api-key/dto/create-api-key.dto.ts` | CreateApiKeyDto (name, permissions, expires_at) |

### New — GDPR DTO (1 file)

| File | Purpose |
|------|---------|
| `src/modules/user/dto/delete-account.dto.ts` | DeleteAccountDto (password confirmation) |

### Modified

| File | Changes |
|------|---------|
| `src/app.module.ts` | Imported `SystemConfigModule`, `InvitationModule`, `ApiKeyModule` |
| `src/modules/auth/auth.service.ts` | Added `requestAccountRecovery()`, `confirmAccountRecovery()`, `impersonate()` |
| `src/modules/auth/auth.controller.ts` | Added 3 endpoints: recover-account, recover-account/confirm, impersonate/:id |
| `src/modules/user/user.service.ts` | Added `findByEmailIncludeDeleted()` for recovery |
| `src/modules/user/user-profile.service.ts` | Added `exportUserData()`, `deleteAccount()` (GDPR) |
| `src/modules/user/user-profile.controller.ts` | Added `GET /user/data-export`, `DELETE /user/account` |
| `src/modules/user/user.module.ts` | Added Session schema import for GDPR queries |
| `src/modules/notification/notification.service.ts` | Added `sendInvitationEmail()`, `sendAccountRecoveryEmail()` |
| `src/modules/notification/email-templates.ts` | Added `invitationTemplate()`, `accountRecoveryTemplate()` |
| `src/modules/audit/audit.interceptor.ts` | Added 15 new route patterns |
| `src/modules/seed/seed.service.ts` | Added `invitation:create/read` permissions |

---

## Database Schemas

### SystemConfig

| Field | Type | Description |
|-------|------|-------------|
| `key` | String (required, unique) | Config key (e.g. `app.site_name`) |
| `value` | Mixed (required) | Any JSON value |
| `category` | String (required) | Category: `app`, `auth`, `email`, `security` |
| `description` | String | Human-readable description |
| `updated_by` | ObjectId (ref User) | Last user to modify this value |
| `created_at` | Date | Auto-generated |
| `updated_at` | Date | Auto-generated |

**Indexes:** `key` (unique), `category`

### Invitation

| Field | Type | Description |
|-------|------|-------------|
| `email` | String (required, lowercase) | Invitee email address |
| `role_id` | ObjectId (ref Role) | Role to assign on acceptance |
| `token` | String (required, unique) | Invitation token |
| `expires_at` | Date (required) | Expiration (7 days from creation) |
| `accepted_at` | Date | When the invitation was accepted |
| `invited_by` | ObjectId (ref User, required) | Admin who sent the invitation |
| `is_revoked` | Boolean (default: false) | Whether the invitation was revoked |
| `created_at` | Date | Auto-generated |
| `updated_at` | Date | Auto-generated |

**Indexes:** `token` (unique), `email`, `expires_at`, `invited_by`

### ApiKey

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | ObjectId (ref User, required) | Key owner |
| `key_hash` | String (required) | Bcrypt hash of the API key |
| `name` | String (required) | Human-readable key name |
| `prefix` | String | First 8 chars of key (for lookup optimization) |
| `permissions` | String[] | Permission slugs scoped to this key |
| `last_used_at` | Date | Last time the key was used |
| `expires_at` | Date | Optional expiration date |
| `is_active` | Boolean (default: true) | Whether the key is active |
| `created_at` | Date | Auto-generated |
| `updated_at` | Date | Auto-generated |

**Indexes:** `user_id`, `key_hash`, `prefix`, `is_active`

---

## Default System Configuration (19 values, auto-seeded)

### App Settings (4)

| Key | Default | Description |
|-----|---------|-------------|
| `app.site_name` | `NestJS App` | Application display name |
| `app.logo_url` | `""` | Application logo URL |
| `app.support_email` | `support@app.com` | Support contact email |
| `app.maintenance_mode` | `false` | Enable maintenance mode |

### Auth Settings (6)

| Key | Default | Description |
|-----|---------|-------------|
| `auth.access_token_ttl` | `15m` | Access token TTL |
| `auth.refresh_token_ttl` | `7d` | Refresh token TTL |
| `auth.password_min_length` | `8` | Minimum password length |
| `auth.max_login_attempts` | `5` | Max failed attempts before lock |
| `auth.lock_duration_minutes` | `30` | Lock duration in minutes |
| `auth.require_email_verification` | `true` | Require email verification |

### Email Settings (4)

| Key | Default | Description |
|-----|---------|-------------|
| `email.smtp_host` | `""` | SMTP server hostname |
| `email.smtp_port` | `587` | SMTP server port |
| `email.from_address` | `noreply@app.com` | Default sender email |
| `email.from_name` | `NestJS App` | Default sender name |

### Security Settings (5)

| Key | Default | Description |
|-----|---------|-------------|
| `security.rate_limit_ttl` | `60000` | Rate limit window (ms) |
| `security.rate_limit_max` | `10` | Max requests per window |
| `security.ip_whitelist` | `[]` | Whitelisted IPs |
| `security.ip_blacklist` | `[]` | Blacklisted IPs |
| `security.session_timeout_minutes` | `1440` | Session timeout (24 hours) |

---

## Existing Utils Used

| Util | Used For |
|------|----------|
| `ErrorEntity` + `HttpStatus` | Error responses across all new services |
| `ResultEntity` | Success responses via global interceptor |
| `BcryptPasswordHelper` | API key hashing + password verification (GDPR delete) |
| `RandomNumberGenerator` | Invitation token generation |
| `DateHelper` | Invitation/recovery expiry calculation |
| `SMTPEmailer` | Sending invitation + recovery emails |
| `@Permissions()` decorator | Endpoint-level permission checks |
| `@Public()` decorator | Public invitation validation + recovery endpoints |
| `@CurrentUser()` decorator | User context for API keys, GDPR, settings |

---

## API Endpoints — System Settings (7)

Base URL: `http://localhost:3000/api/v1`

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | GET | `/admin/settings` | `settings:read` | Get all config values |
| 2 | GET | `/admin/settings/category/:category` | `settings:read` | Get config by category |
| 3 | GET | `/admin/settings/key/:key` | `settings:read` | Get single config value |
| 4 | POST | `/admin/settings` | `settings:update` | Create new config entry |
| 5 | PATCH | `/admin/settings/key/:key` | `settings:update` | Update config value |
| 6 | PATCH | `/admin/settings/category/:category` | `settings:update` | Bulk update by category |
| 7 | DELETE | `/admin/settings/key/:key` | `settings:update` | Delete config entry |

## API Endpoints — Invitations (6)

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | POST | `/admin/invitations` | `user:create` | Send invitation email |
| 2 | GET | `/admin/invitations` | `user:read` | List invitations (filterable) |
| 3 | GET | `/admin/invitations/:id` | `user:read` | Get invitation by ID |
| 4 | POST | `/admin/invitations/:id/resend` | `user:create` | Resend (extends expiry) |
| 5 | DELETE | `/admin/invitations/:id` | `user:create` | Revoke invitation |
| 6 | GET | `/invitations/validate/:token` | Public | Validate invitation token |

## API Endpoints — API Keys (5)

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | POST | `/user/api-keys` | `user:update` | Generate new API key |
| 2 | GET | `/user/api-keys` | `user:read` | List your keys (hash hidden) |
| 3 | GET | `/user/api-keys/:id` | `user:read` | Get key details |
| 4 | POST | `/user/api-keys/:id/revoke` | `user:update` | Revoke (deactivate) key |
| 5 | DELETE | `/user/api-keys/:id` | `user:update` | Permanently delete key |

## API Endpoints — GDPR (2)

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | GET | `/user/data-export` | `user:read` | Export all your data |
| 2 | DELETE | `/user/account` | `user:update` | Delete account (password required) |

## API Endpoints — Account Recovery (2)

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | POST | `/auth/recover-account` | Public | Request recovery email |
| 2 | POST | `/auth/recover-account/confirm` | Public | Confirm recovery with token |

## API Endpoints — Admin Impersonation (1)

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | POST | `/auth/impersonate/:id` | Authenticated | Impersonate user (returns 1hr token) |

---

## Audit Interceptor — New Tracked Routes (15)

### Settings Actions (4)

| Action | Route | Description |
|--------|-------|-------------|
| `settings.create` | `POST /admin/settings` | Created config key |
| `settings.update` | `PATCH /admin/settings/key/:key` | Updated config key |
| `settings.bulk_update` | `PATCH /admin/settings/category/:cat` | Bulk updated config category |
| `settings.delete` | `DELETE /admin/settings/key/:key` | Deleted config key |

### Invitation Actions (3)

| Action | Route | Description |
|--------|-------|-------------|
| `invitation.create` | `POST /admin/invitations` | Sent invitation |
| `invitation.resend` | `POST /admin/invitations/:id/resend` | Resent invitation |
| `invitation.revoke` | `DELETE /admin/invitations/:id` | Revoked invitation |

### API Key Actions (3)

| Action | Route | Description |
|--------|-------|-------------|
| `api_key.create` | `POST /user/api-keys` | Created API key |
| `api_key.revoke` | `POST /user/api-keys/:id/revoke` | Revoked API key |
| `api_key.delete` | `DELETE /user/api-keys/:id` | Deleted API key |

### GDPR Actions (1)

| Action | Route | Description |
|--------|-------|-------------|
| `user.delete_account` | `DELETE /user/account` | User requested account deletion |

### Impersonation Actions (1)

| Action | Route | Description |
|--------|-------|-------------|
| `admin.impersonate` | `POST /auth/impersonate/:id` | Admin impersonated user |

### Account Recovery Actions (2)

| Action | Route | Description |
|--------|-------|-------------|
| `auth.recover_account_request` | `POST /auth/recover-account` | Recovery requested |
| `auth.recover_account_confirm` | `POST /auth/recover-account/confirm` | Recovery confirmed |

---

## How to Test

### Prerequisites

1. Start MongoDB + run `npm run start:dev`
2. Login as admin/super_admin user
3. Save the `access_token`

---

### System Settings — Step 1: View All Settings

```bash
curl -X GET "http://localhost:3000/api/v1/admin/settings" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Array of 19 seeded config entries

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "_id": "...",
      "key": "app.maintenance_mode",
      "value": false,
      "category": "app",
      "description": "Enable maintenance mode",
      "created_at": "2026-03-13T..."
    },
    {
      "key": "app.site_name",
      "value": "NestJS App",
      "category": "app",
      "description": "Application display name"
    }
  ]
}
```

---

### System Settings — Step 2: Get by Category

```bash
# Auth settings
curl -X GET "http://localhost:3000/api/v1/admin/settings/category/auth" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Security settings
curl -X GET "http://localhost:3000/api/v1/admin/settings/category/security" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### System Settings — Step 3: Update a Config Value

```bash
# Change site name
curl -X PATCH "http://localhost:3000/api/v1/admin/settings/key/app.site_name" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "My Production App"
  }'

# Enable maintenance mode
curl -X PATCH "http://localhost:3000/api/v1/admin/settings/key/app.maintenance_mode" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "value": true,
    "description": "Enabled for deployment"
  }'
```

**Expected:** `200` — Updated config entry

---

### System Settings — Step 4: Bulk Update by Category

```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/settings/category/auth" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "auth.max_login_attempts": 10,
    "auth.lock_duration_minutes": 15
  }'
```

---

### System Settings — Step 5: Create Custom Config

```bash
curl -X POST "http://localhost:3000/api/v1/admin/settings" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "app.custom_feature_flag",
    "value": true,
    "category": "app",
    "description": "Enable custom feature X"
  }'
```

**Expected:** `201` — New config entry

---

### Invitations — Step 1: Send Invitation

```bash
curl -X POST "http://localhost:3000/api/v1/admin/invitations" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "role_id": "<ROLE_ID>"
  }'
```

**Expected:** `201` — Invitation with token (email sent)

```json
{
  "success": true,
  "code": 201,
  "data": {
    "_id": "...",
    "email": "newuser@example.com",
    "role_id": "...",
    "expires_at": "2026-03-20T...",
    "token": "abc123..."
  }
}
```

---

### Invitations — Step 2: List Invitations

```bash
# All invitations
curl -X GET "http://localhost:3000/api/v1/admin/invitations" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Only pending
curl -X GET "http://localhost:3000/api/v1/admin/invitations?status=pending" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Only accepted
curl -X GET "http://localhost:3000/api/v1/admin/invitations?status=accepted" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Only expired
curl -X GET "http://localhost:3000/api/v1/admin/invitations?status=expired" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### Invitations — Step 3: Validate Token (Public)

```bash
curl -X GET "http://localhost:3000/api/v1/invitations/validate/<TOKEN>"
```

**Expected:** `200` — Invitation details (for frontend registration form)

---

### Invitations — Step 4: Resend Invitation

```bash
curl -X POST "http://localhost:3000/api/v1/admin/invitations/<INVITATION_ID>/resend" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — `{ message: "Invitation resent", expires_at: "..." }`

---

### Invitations — Step 5: Revoke Invitation

```bash
curl -X DELETE "http://localhost:3000/api/v1/admin/invitations/<INVITATION_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — `{ message: "Invitation revoked" }`

---

### Invitations — Step 6: Duplicate Prevention

```bash
# Send to existing user
curl -X POST "http://localhost:3000/api/v1/admin/invitations" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "email": "existing@example.com" }'
```

**Expected:** `409` — `user_exists`

```bash
# Send duplicate pending invitation
curl -X POST "http://localhost:3000/api/v1/admin/invitations" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "email": "newuser@example.com" }'
```

**Expected:** `409` — `invitation_pending`

---

### API Keys — Step 1: Generate Key

```bash
curl -X POST "http://localhost:3000/api/v1/user/api-keys" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Integration Key",
    "permissions": ["user:read", "session:read"],
    "expires_at": "2026-12-31T23:59:59Z"
  }'
```

**Expected:** `201` — Key details (raw key shown ONLY here)

```json
{
  "success": true,
  "code": 201,
  "data": {
    "_id": "...",
    "name": "My Integration Key",
    "key": "a1b2c3d4e5f6...64 hex chars...",
    "prefix": "a1b2c3d4",
    "permissions": ["user:read", "session:read"],
    "expires_at": "2026-12-31T23:59:59.000Z",
    "created_at": "2026-03-13T...",
    "warning": "Save this key now. It cannot be retrieved later."
  }
}
```

---

### API Keys — Step 2: List Keys

```bash
curl -X GET "http://localhost:3000/api/v1/user/api-keys" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Array of keys (key_hash excluded, raw key NOT included)

---

### API Keys — Step 3: Revoke Key

```bash
curl -X POST "http://localhost:3000/api/v1/user/api-keys/<KEY_ID>/revoke" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — `{ message: "API key revoked" }`

---

### API Keys — Step 4: Delete Key

```bash
curl -X DELETE "http://localhost:3000/api/v1/user/api-keys/<KEY_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — `{ deleted: true }`

---

### GDPR — Step 1: Export Data

```bash
curl -X GET "http://localhost:3000/api/v1/user/data-export" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Full user data export

```json
{
  "success": true,
  "code": 200,
  "data": {
    "exported_at": "2026-03-13T...",
    "user": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "active",
      "is_verified": true,
      "is_2fa_enabled": false,
      "notification_preferences": {
        "email_on_login": false,
        "email_on_password_change": true,
        "email_on_security_alert": true
      },
      "last_login_at": "2026-03-13T...",
      "created_at": "2026-02-15T..."
    },
    "sessions": [
      {
        "device": "Mozilla/5.0...",
        "ip_address": "192.168.1.1",
        "is_active": true,
        "created_at": "2026-03-13T...",
        "expires_at": "2026-03-20T..."
      }
    ]
  }
}
```

---

### GDPR — Step 2: Delete Account

```bash
curl -X DELETE "http://localhost:3000/api/v1/user/account" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "MyCurrentPassword123"
  }'
```

**Expected:** `200` — Account soft-deleted

```json
{
  "success": true,
  "code": 200,
  "data": {
    "message": "Your account has been scheduled for deletion. You can recover it within 30 days by contacting support or using account recovery."
  }
}
```

**What happens on deletion:**
- `is_deleted` → `true`, `deleted_at` → now
- `status` → `inactive`
- `first_name` → `Deleted`, `last_name` → `User`
- `phone`, `avatar_url` → cleared
- `notification_preferences` → all disabled
- All active sessions terminated

---

### GDPR — Step 3: Wrong Password

```bash
curl -X DELETE "http://localhost:3000/api/v1/user/account" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "password": "WrongPassword" }'
```

**Expected:** `401` — `invalid_password`

---

### Account Recovery — Step 1: Request Recovery

```bash
curl -X POST "http://localhost:3000/api/v1/auth/recover-account" \
  -H "Content-Type: application/json" \
  -d '{ "email": "deleted-user@example.com" }'
```

**Expected:** `200` — Always returns same message (prevents enumeration)

```json
{
  "success": true,
  "code": 200,
  "data": {
    "message": "If the account exists and is recoverable, a recovery email has been sent."
  }
}
```

---

### Account Recovery — Step 2: Confirm Recovery

```bash
curl -X POST "http://localhost:3000/api/v1/auth/recover-account/confirm" \
  -H "Content-Type: application/json" \
  -d '{ "token": "<RECOVERY_TOKEN_FROM_EMAIL>" }'
```

**Expected:** `200` — Account restored

```json
{
  "success": true,
  "code": 200,
  "data": {
    "message": "Account recovered successfully. You can now log in."
  }
}
```

**What happens on recovery:**
- `is_deleted` → `false`, `deleted_at` → cleared
- `status` → `active`
- Recovery token cleared
- Security event logged

---

### Admin Impersonation

```bash
curl -X POST "http://localhost:3000/api/v1/auth/impersonate/<USER_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Short-lived impersonation token

```json
{
  "success": true,
  "code": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "impersonating": {
      "_id": "...",
      "email": "target@example.com",
      "first_name": "Target",
      "last_name": "User"
    },
    "warning": "This is an impersonation token. All actions will be logged."
  }
}
```

**Security details:**
- Token expires in 1 hour (short-lived)
- JWT payload includes `impersonated_by` field for audit trail
- Security event logged with admin user ID and target user details
- Cannot impersonate deleted users

---

## Useful MongoDB Queries

```javascript
// ── System Config ──

// View all config
db.systemconfigs.find().sort({ category: 1, key: 1 })

// View by category
db.systemconfigs.find({ category: "auth" })

// Get single value
db.systemconfigs.findOne({ key: "app.site_name" })

// ── Invitations ──

// All pending invitations
db.invitations.find({
  accepted_at: null,
  is_revoked: false,
  expires_at: { $gt: new Date() }
})

// Accepted invitations
db.invitations.find({ accepted_at: { $ne: null } })

// Expired invitations
db.invitations.find({
  accepted_at: null,
  is_revoked: false,
  expires_at: { $lte: new Date() }
})

// Invitations by admin
db.invitations.find({ invited_by: ObjectId("<ADMIN_ID>") })

// ── API Keys ──

// All keys for a user
db.apikeys.find({ user_id: ObjectId("<USER_ID>") })

// Active keys only
db.apikeys.find({ is_active: true })

// Expired keys
db.apikeys.find({ expires_at: { $lte: new Date() } })

// Recently used keys
db.apikeys.find({ last_used_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })

// ── GDPR / Recovery ──

// Deleted accounts
db.users.find({ is_deleted: true })

// Recently deleted (last 30 days, recoverable)
db.users.find({
  is_deleted: true,
  deleted_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})

// ── Audit: Sprint 10 actions ──
db.auditlogs.find({ action: /^settings\./ }).sort({ created_at: -1 })
db.auditlogs.find({ action: /^invitation\./ }).sort({ created_at: -1 })
db.auditlogs.find({ action: /^api_key\./ }).sort({ created_at: -1 })
db.auditlogs.find({ action: "admin.impersonate" }).sort({ created_at: -1 })
db.auditlogs.find({ action: "user.delete_account" }).sort({ created_at: -1 })
db.auditlogs.find({ action: /^auth\.recover/ }).sort({ created_at: -1 })
```

---

## Architecture

### System Config — Auto-Seed Pattern

```
App Startup
    → SystemConfigService.onModuleInit()
        → seedDefaults()
            → For each of 19 defaults:
                → findOne({ key }) → if not exists, create
        → Logs "Seeded N default config values"
```

Seeding is idempotent — existing values are never overwritten.

### Invitation Flow

```
Admin: POST /admin/invitations { email, role_id }
    → Check user doesn't exist
    → Check no pending invitation
    → Generate token, set 7-day expiry
    → Save to DB
    → Send invitation email
    → Return token

Invitee: GET /invitations/validate/:token (public)
    → Validate token (not expired, not revoked, not used)
    → Return invitation details (for frontend registration form)

Invitee: Registers via normal /auth/register
    → Frontend passes invitation token
    → (Integration point for accepting invitation + assigning role)
```

### API Key Security Model

```
Key Generation:
    → crypto.randomBytes(32) → 64 hex chars
    → prefix = first 8 chars (stored plaintext for lookup)
    → key_hash = bcrypt(rawKey) (stored)
    → Return raw key ONLY on creation

Key Validation:
    → Extract prefix from rawKey
    → Find candidates by prefix (fast index lookup)
    → For each candidate:
        → Check expiry
        → bcrypt.compare(rawKey, candidate.key_hash)
        → If match: update last_used_at, return user_id + permissions
```

### GDPR Account Deletion Flow

```
User: DELETE /user/account { password }
    → Verify password
    → Soft delete:
        → is_deleted = true, deleted_at = now
        → status = inactive
        → Anonymize PII (name → "Deleted User", clear phone/avatar)
        → Disable all notification preferences
    → Terminate all active sessions
    → Return recovery instructions

User: POST /auth/recover-account { email }
    → findByEmailIncludeDeleted() (bypasses is_deleted filter)
    → If deleted: generate recovery token, send email
    → Always return same message (prevent enumeration)

User: POST /auth/recover-account/confirm { token }
    → Validate token
    → Restore: is_deleted = false, status = active
    → Log security event
```

### Impersonation Security

```
Admin: POST /auth/impersonate/:id
    → Validate target user exists and not deleted
    → Generate JWT with:
        → sub: targetUserId
        → email: targetEmail
        → impersonated_by: adminUserId (audit trail)
    → Token expires in 1 hour (short-lived)
    → Log security event: "Admin X impersonated user Y"
    → Return token + warning
```

---

## Sprint 10 Task Completion

### Enterprise Features

| # | Task | Status |
|---|------|--------|
| 1 | User invitation system | ✅ 5 admin endpoints + 1 public + email template |
| 2 | Temporary access (time-limited roles) | ⚠️ Partial — API keys have expiry; full role-level TTL deferred |
| 3 | Feature flags per user | ⚠️ Partial — System config supports flags; per-user flags deferred |
| 4 | API keys per user | ✅ 5 endpoints, bcrypt-hashed, permission-scoped |
| 5 | Admin impersonation | ✅ `POST /auth/impersonate/:id` with 1hr token |
| 6 | User data export (GDPR) | ✅ `GET /user/data-export` |
| 7 | Account deletion (GDPR) | ✅ `DELETE /user/account` with PII anonymization |
| 8 | Account recovery | ✅ `POST /auth/recover-account` + `/confirm` |
| 9 | Social login (Google, GitHub) | ❌ Deferred — requires `passport-google-oauth20` + `passport-github2` packages and OAuth app credentials |
| 10 | SSO support (SAML/OAuth) | ❌ Deferred — enterprise integration, requires external IdP |

### System Configuration

| # | Task | Status |
|---|------|--------|
| 1 | App settings (site name, logo, etc.) | ✅ 4 app config values + CRUD |
| 2 | Auth settings (token expiry, password policy) | ✅ 6 auth config values |
| 3 | Email settings (SMTP config) | ✅ 4 email config values |
| 4 | Security settings (rate limits, IP whitelist) | ✅ 5 security config values |

---

## Notes on Deferred Features

### Social Login (Google, GitHub)
Requires external OAuth app setup and additional packages:
- `passport-google-oauth20` — Google OAuth2 strategy
- `passport-github2` — GitHub OAuth2 strategy

These need `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` env vars and OAuth app registration with the respective providers. The architecture is ready (Passport.js already integrated), but implementation is deferred until credentials are available.

### SSO (SAML/OAuth)
Enterprise SSO typically requires:
- A SAML IdP (Okta, Azure AD, etc.)
- `passport-saml` or `@node-saml/passport-saml` package
- Organization-specific metadata configuration

This is an integration task that depends on the target enterprise environment.

---

## Swagger UI

After starting the app, visit: `http://localhost:3000/api-docs`

New sections:
- **Admin - Settings** — 7 endpoints for system configuration management
- **Admin - Invitations** — 5 endpoints for invitation management
- **Invitations** — 1 public endpoint for token validation
- **User - API Keys** — 5 endpoints for API key management

Updated sections:
- **User Profile** — 2 new GDPR endpoints (data export + account deletion)
- **Auth** — 3 new endpoints (account recovery request/confirm + impersonation)

All admin endpoints require Bearer token + appropriate permissions. GDPR and API key endpoints require user authentication.

---

## Full Project Module Summary (Sprints 1–10)

| Module | Sprint | Endpoints |
|--------|--------|-----------|
| Auth | 1, 6, 10 | 15 |
| User Profile | 2, 10 | 11 |
| Role | 3 | 10+ |
| Permission | 3 | 5+ |
| RBAC Guards | 4 | — |
| Admin Users | 5 | 14 |
| Session | 6 | 7+ |
| Notification | 7 | — |
| Audit | 8 | 5 |
| Analytics | 9 | 8 |
| Groups | 9 | 10 |
| System Config | 10 | 7 |
| Invitations | 10 | 6 |
| API Keys | 10 | 5 |
| **Total** | | **100+** |

**13 registered modules** in `app.module.ts` + global guards and interceptors.
