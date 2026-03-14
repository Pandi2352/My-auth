# Sprint 6 — Session Management & Security (Complete)

## Summary

Sprint 6 implements session tracking, login attempt history, and security event logging. Every login creates a tracked session with device/browser/OS/IP/location info. Users can view their active sessions, terminate specific or all sessions. Security-sensitive actions (password reset, 2FA enable/disable) are logged as security events.

---

## Files Created / Modified

### New — Session Module (7 files)

| File | Purpose |
|------|---------|
| `src/modules/session/session.module.ts` | Session module registration, exports SessionService |
| `src/modules/session/session.service.ts` | Session CRUD, login attempt tracking, security event logging |
| `src/modules/session/session.controller.ts` | 5 REST endpoints (SessionController + SecurityController) |
| `src/modules/session/schemas/session.schema.ts` | Session schema — tracks active sessions with device info |
| `src/modules/session/schemas/login-attempt.schema.ts` | LoginAttempt schema — records every login attempt |
| `src/modules/session/schemas/security-event.schema.ts` | SecurityEvent schema — logs security-sensitive actions |
| `src/modules/session/dto/pagination-query.dto.ts` | Pagination query DTO (page, limit) |

### Modified

| File | Changes |
|------|---------|
| `src/modules/auth/auth.service.ts` | Injected `SessionService`. Login creates session + records attempt. Logout terminates all sessions. Password reset terminates sessions + logs event. 2FA verify/disable log security events. |
| `src/modules/auth/auth.module.ts` | Imported `SessionModule` |
| `src/modules/seed/seed.service.ts` | Updated default "User" role to include `user:update`, `session:read`, `session:delete` permissions |
| `src/app.module.ts` | Imported `SessionModule` |

---

## Database Schemas

### Session

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | ObjectId (ref User) | Session owner |
| `token_hash` | String | Hashed refresh token (links session to token) |
| `device` | String | Device name (parsed from user agent) |
| `browser` | String | Browser name + version |
| `os` | String | Operating system + version |
| `ip_address` | String | Client IP address |
| `location` | String | City, region, country (from IP, optional) |
| `user_agent` | String | Raw user agent string |
| `is_active` | Boolean | Whether session is still active |
| `last_activity` | Date | Last activity timestamp |
| `expires_at` | Date | Session expiration (TTL index auto-deletes expired) |
| `created_at` | Date | Auto-generated |

**Indexes:** `user_id`, `token_hash`, `is_active`, `expires_at` (TTL)

### LoginAttempt

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | ObjectId (ref User) | User who attempted login (optional — null for unknown emails) |
| `email` | String | Email used in login attempt |
| `ip_address` | String | Client IP |
| `user_agent` | String | Raw user agent |
| `device` | String | Parsed device name |
| `browser` | String | Parsed browser name + version |
| `os` | String | Parsed OS + version |
| `location` | String | IP geolocation (optional) |
| `success` | Boolean | Whether login succeeded |
| `failure_reason` | String | Reason for failure (if applicable) |
| `created_at` | Date | Auto-generated |

**Indexes:** `user_id`, `email`, `ip_address`, `created_at`

### SecurityEvent

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | ObjectId (ref User) | User associated with the event |
| `event_type` | String | Event type identifier |
| `description` | String | Human-readable description |
| `ip_address` | String | Client IP (optional) |
| `user_agent` | String | Raw user agent (optional) |
| `metadata` | Object | Additional key-value data (optional) |
| `created_at` | Date | Auto-generated |

**Indexes:** `user_id`, `event_type`, `created_at`

**Tracked event types:**

| Event Type | Triggered When |
|-----------|---------------|
| `password_reset` | User resets password via reset token |
| `2fa_enabled` | User activates two-factor authentication |
| `2fa_disabled` | User disables two-factor authentication |

---

## Existing Utils Used

| Util | Used For |
|------|----------|
| `UserAgentHelper` | Parsing user agent strings → device, browser, OS using ua-parser-js v2 |
| `IPToLocationUtils` | IP-to-location lookup (optional, graceful fallback if not configured) |
| `ErrorEntity` + `HttpStatus` | All error responses |
| `ResultEntity` | All success responses via global interceptor |
| `BcryptPasswordHelper` | Token hashing for session-to-token linkage |

---

## API Endpoints (5)

Base URL: `http://localhost:3000/api/v1`

### Session Endpoints

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | GET | `/sessions` | `session:read` | Get all active sessions for current user |
| 2 | DELETE | `/sessions/:id` | `session:delete` | Terminate a specific session |
| 3 | DELETE | `/sessions` | `session:delete` | Terminate all sessions except current |

### Security Endpoints

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 4 | GET | `/security/login-history` | `session:read` | Get paginated login attempt history |
| 5 | GET | `/security/events` | `session:read` | Get paginated security events |

---

## Auth Flow Integration

### Login (`POST /auth/login`)

After successful authentication:
1. Creates refresh token (existing)
2. **Creates session** — stores device/browser/OS/IP/location + links to token hash
3. **Records login attempt** — success=true with device info
4. Updates `last_login_at` (existing)

### Logout (`POST /auth/logout`)

1. Revokes all refresh tokens (existing)
2. **Terminates all active sessions**

### Password Reset (`POST /auth/reset-password`)

1. Changes password (existing)
2. Revokes all refresh tokens (existing)
3. **Terminates all active sessions**
4. **Logs `password_reset` security event**

### 2FA Verify (`POST /auth/2fa/verify`)

1. Validates TOTP token and enables 2FA (existing)
2. **Logs `2fa_enabled` security event**

### 2FA Disable (`POST /auth/2fa/disable`)

1. Validates TOTP token and disables 2FA (existing)
2. **Logs `2fa_disabled` security event**

---

## Default Role Permissions Updated

The default **"User"** role was updated from Sprint 4 to include session management permissions:

| Permission | Before Sprint 6 | After Sprint 6 |
|-----------|-----------------|----------------|
| `user:read` | ✅ | ✅ |
| `user:update` | ❌ | ✅ |
| `session:read` | ❌ | ✅ |
| `session:delete` | ❌ | ✅ |

This allows regular users to:
- View and update their own profile
- View their active sessions
- Terminate their own sessions
- View their login history and security events

---

## How to Test Every API

### Prerequisites

1. Start MongoDB + run `npm run start:dev`
2. Login as any user (regular users now have `session:read` and `session:delete` permissions)
3. Save the `access_token`

---

### Step 1: View Active Sessions

```bash
curl -X GET "http://localhost:3000/api/v1/sessions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Array of active sessions

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "_id": "...",
      "user_id": "...",
      "device": "Windows desktop",
      "browser": "Chrome 120.0",
      "os": "Windows 11",
      "ip_address": "::1",
      "location": "",
      "user_agent": "...",
      "is_active": true,
      "last_activity": "2026-03-13T...",
      "expires_at": "2026-03-20T...",
      "created_at": "2026-03-13T..."
    }
  ]
}
```

**Note:** `token_hash` is excluded from the response (sensitive field).

| # | Test | Expected |
|---|------|----------|
| 1 | After login | `200` — at least 1 session |
| 2 | After multiple logins from different devices | `200` — multiple sessions |
| 3 | No token | `401` — unauthorized |

---

### Step 2: Terminate a Specific Session

```bash
curl -X DELETE "http://localhost:3000/api/v1/sessions/<SESSION_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — `Session terminated successfully`

| # | Test | Expected |
|---|------|----------|
| 1 | Valid session ID | `200` — session terminated |
| 2 | Already terminated session | `404` — `session_not_found` |
| 3 | Other user's session ID | `404` — `session_not_found` (user_id filter) |
| 4 | Invalid ObjectId | `500` — cast error |

### Verify:

```bash
# Session should no longer appear in active sessions list
curl -X GET "http://localhost:3000/api/v1/sessions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Step 3: Terminate All Sessions

```bash
curl -X DELETE "http://localhost:3000/api/v1/sessions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — `Terminated N session(s)`

| # | Test | Expected |
|---|------|----------|
| 1 | With multiple active sessions | `200` — all terminated |
| 2 | With no sessions | `200` — `Terminated 0 session(s)` |

---

### Step 4: View Login History

```bash
# Default pagination
curl -X GET "http://localhost:3000/api/v1/security/login-history" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# With pagination
curl -X GET "http://localhost:3000/api/v1/security/login-history?page=1&limit=10" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Paginated login attempts

```json
{
  "success": true,
  "code": 200,
  "data": {
    "attempts": [
      {
        "_id": "...",
        "user_id": "...",
        "email": "user@example.com",
        "ip_address": "::1",
        "user_agent": "...",
        "device": "Windows desktop",
        "browser": "Chrome 120.0",
        "os": "Windows 11",
        "location": "",
        "success": true,
        "created_at": "2026-03-13T..."
      }
    ],
    "meta_data": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "total_pages": 1
    }
  }
}
```

| # | Test | Expected |
|---|------|----------|
| 1 | After multiple logins | `200` — all attempts listed |
| 2 | `?page=2&limit=1` | `200` — paginated |
| 3 | No login history | `200` — empty attempts array |

---

### Step 5: View Security Events

```bash
# Default pagination
curl -X GET "http://localhost:3000/api/v1/security/events" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# With pagination
curl -X GET "http://localhost:3000/api/v1/security/events?page=1&limit=10" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Paginated security events

```json
{
  "success": true,
  "code": 200,
  "data": {
    "events": [
      {
        "_id": "...",
        "user_id": "...",
        "event_type": "password_reset",
        "description": "Password was reset via reset token",
        "created_at": "2026-03-13T..."
      }
    ],
    "meta_data": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

| # | Test | Expected |
|---|------|----------|
| 1 | After password reset | `200` — `password_reset` event |
| 2 | After enabling 2FA | `200` — `2fa_enabled` event |
| 3 | After disabling 2FA | `200` — `2fa_disabled` event |
| 4 | No events | `200` — empty events array |

---

### Step 6: Test Security Event Generation

#### Password Reset Event

```bash
# Request password reset
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{ "email": "user@example.com" }'

# Reset password (use token from email)
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<RESET_TOKEN>",
    "new_password": "NewPassword123"
  }'

# Login with new password, then check security events
curl -X GET "http://localhost:3000/api/v1/security/events" \
  -H "Authorization: Bearer <NEW_ACCESS_TOKEN>"
```

**Expected:** `password_reset` event in the list

#### 2FA Events

```bash
# Enable 2FA
curl -X POST http://localhost:3000/api/v1/auth/2fa/enable \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Verify 2FA (use token from authenticator app)
curl -X POST http://localhost:3000/api/v1/auth/2fa/verify \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "token": "<TOTP_TOKEN>" }'

# Check security events — should see "2fa_enabled"
curl -X GET "http://localhost:3000/api/v1/security/events" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Disable 2FA
curl -X POST http://localhost:3000/api/v1/auth/2fa/disable \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "token": "<TOTP_TOKEN>" }'

# Check security events — should see "2fa_disabled"
curl -X GET "http://localhost:3000/api/v1/security/events" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Step 7: Test Session Creation on Login

```bash
# Login from different clients / user agents
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0" \
  -d '{
    "email": "user@example.com",
    "password": "YourPassword",
    "remember_me": false
  }'

# Login again with different user agent
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1 Mobile/15E148" \
  -d '{
    "email": "user@example.com",
    "password": "YourPassword",
    "remember_me": false
  }'

# Check sessions — should see 2 sessions with different device info
curl -X GET "http://localhost:3000/api/v1/sessions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** Two sessions with different `device`, `browser`, `os` values

---

### Step 8: Test Session Termination on Logout

```bash
# Check active sessions first
curl -X GET "http://localhost:3000/api/v1/sessions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Login again and check sessions — all previous sessions should be terminated
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "YourPassword",
    "remember_me": false
  }'

curl -X GET "http://localhost:3000/api/v1/sessions" \
  -H "Authorization: Bearer <NEW_ACCESS_TOKEN>"
```

**Expected:** Only 1 session (the new login)

---

## Useful MongoDB Queries

```javascript
// ── View all sessions for a user ──
db.sessions.find({ user_id: ObjectId("<USER_ID>") }).sort({ created_at: -1 })

// ── View active sessions only ──
db.sessions.find({ user_id: ObjectId("<USER_ID>"), is_active: true })

// ── View login attempts ──
db.loginattempts.find({ user_id: ObjectId("<USER_ID>") }).sort({ created_at: -1 })

// ── View failed login attempts ──
db.loginattempts.find({ success: false }).sort({ created_at: -1 })

// ── View login attempts by IP ──
db.loginattempts.find({ ip_address: "::1" }).sort({ created_at: -1 })

// ── View security events ──
db.securityevents.find({ user_id: ObjectId("<USER_ID>") }).sort({ created_at: -1 })

// ── View security events by type ──
db.securityevents.find({ event_type: "password_reset" })

// ── Count sessions per user ──
db.sessions.aggregate([
  { $match: { is_active: true } },
  { $group: { _id: "$user_id", count: { $sum: 1 } } }
])

// ── Count login attempts by success/failure ──
db.loginattempts.aggregate([
  { $group: { _id: "$success", count: { $sum: 1 } } }
])

// ── Cleanup expired sessions (manual — TTL index handles this automatically) ──
db.sessions.deleteMany({ expires_at: { $lt: new Date() } })
```

---

## Architecture Decisions

### Session-Token Linkage

Sessions are linked to refresh tokens via `token_hash`. When a refresh token is revoked (logout, password reset), the corresponding session is also terminated. This ensures session state always matches token validity.

### UserAgentHelper Integration

Uses the existing `UserAgentHelper` singleton (ua-parser-js v2) to parse user agent strings into structured device/browser/OS data. This provides human-readable session descriptions (e.g., "Chrome 120.0 on Windows 11") instead of raw user agent strings.

### IP Geolocation (Optional)

Uses `IPToLocationUtils` with a try-catch fallback. If the IP-to-location database is not configured, location defaults to an empty string. This makes the feature opt-in without breaking the session system.

### TTL Index on Sessions

The `expires_at` field has a MongoDB TTL index (`expireAfterSeconds: 0`), which automatically removes expired session documents. This prevents unbounded collection growth without requiring manual cleanup.

### Security Event Logging

Security events are decoupled from the actions themselves — they are logged after the action succeeds. This means a failed password reset or 2FA operation won't generate a misleading event. Events capture the `user_id`, `event_type`, and `description` at minimum, with optional `ip_address`, `user_agent`, and `metadata` for richer context.

### Default User Role Expansion

The default "User" role was expanded to include `user:update`, `session:read`, and `session:delete`. This allows self-service users to manage their own profile and sessions without requiring admin intervention, while still keeping admin-level permissions (like `user:create`, `user:delete`) restricted.

---

## Security Features Already In Place (Prior Sprints)

| Feature | Sprint | Status |
|---------|--------|--------|
| Rate limiting (ThrottlerModule) | Sprint 1 | ✅ Global |
| Account lockout (failed attempts) | Sprint 1 | ✅ 5 attempts → 30min lock |
| JWT access + refresh tokens | Sprint 1 | ✅ |
| Bcrypt password hashing | Sprint 1 | ✅ |
| Email verification | Sprint 1 | ✅ |
| 2FA with TOTP | Sprint 2 | ✅ |
| RBAC (roles + permissions) | Sprint 3 | ✅ Global guards |
| Admin user management | Sprint 4 | ✅ |
| **Session tracking** | **Sprint 6** | **✅** |
| **Login attempt history** | **Sprint 6** | **✅** |
| **Security event logging** | **Sprint 6** | **✅** |

---

## Sprint 6 Task Completion

### Session Management

| # | Task | Status |
|---|------|--------|
| 1 | View active sessions | ✅ `GET /sessions` |
| 2 | Track login device & user agent | ✅ UserAgentHelper parses UA |
| 3 | Track IP address | ✅ Stored on session + login attempt |
| 4 | Track login location (IP-to-location) | ✅ Optional, graceful fallback |
| 5 | Logout current session | ✅ `DELETE /sessions` terminates all |
| 6 | Logout all sessions | ✅ Integrated in `POST /auth/logout` |
| 7 | Terminate specific session | ✅ `DELETE /sessions/:id` |

### Security

| # | Task | Status |
|---|------|--------|
| 1 | Rate limiting (throttler) | ✅ Already global (Sprint 1) |
| 2 | Login attempt tracking | ✅ LoginAttempt schema + service |
| 3 | IP blocking | ⏭️ Future sprint (requires config UI) |
| 4 | CAPTCHA verification | ⏭️ Future sprint (requires frontend) |
| 5 | Two-factor authentication (TOTP) | ✅ Already done (Sprint 2) |
| 6 | Password expiration policy | ⏭️ Future sprint (requires settings module) |
| 7 | Session timeout | ✅ TTL index on expires_at |
| 8 | CSRF protection | ⏭️ Future sprint (requires frontend) |
| 9 | Helmet (XSS, headers) | ⏭️ Future sprint (npm install + middleware) |

---

## Swagger UI

After starting the app, visit: `http://localhost:3000/api-docs`

New sections:
- **Sessions** — 3 endpoints for viewing and terminating sessions
- **Security** — 2 endpoints for login history and security events

All require Bearer token + `session:read` or `session:delete` permission.
