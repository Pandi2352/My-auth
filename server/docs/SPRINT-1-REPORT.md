# Sprint 1 — Authentication (Complete)

## Summary

Sprint 1 delivers the full authentication module including user registration, JWT-based login with access/refresh tokens, email verification, password reset, 2FA (TOTP), account locking, rate limiting, and a unified response format across all APIs.

---

## Files Created / Modified

### Config

| File | Purpose |
|------|---------|
| `src/config/jwt.config.ts` | JWT secrets, token expiry settings |
| `.env.development` | Environment variables template |

### Common (Reusable across all modules)

| File | Purpose |
|------|---------|
| `src/common/constants/index.ts` | `IS_PUBLIC_KEY`, `PASSWORD_MIN_LENGTH`, `MAX_LOGIN_ATTEMPTS`, `LOCK_DURATION_MINUTES` |
| `src/common/enums/user-status.enum.ts` | `UserStatus` enum: active, inactive, suspended, pending, locked |
| `src/common/decorators/public.decorator.ts` | `@Public()` — marks route as public (skips JWT check) |
| `src/common/decorators/current-user.decorator.ts` | `@CurrentUser()` — extracts logged-in user from request |
| `src/common/guards/jwt-auth.guard.ts` | Global JWT guard (auto-protects all routes, respects `@Public`) |
| `src/common/guards/local-auth.guard.ts` | Local strategy guard (email + password login) |
| `src/common/interceptors/response.interceptor.ts` | Wraps all success responses in `ResultEntity` format |
| `src/common/filters/global-exception.filter.ts` | Catches all errors, wraps in `ResultEntity` + `ErrorEntity` format |

### Auth Module

| File | Purpose |
|------|---------|
| `src/modules/auth/auth.module.ts` | Auth module registration |
| `src/modules/auth/auth.controller.ts` | All auth endpoints |
| `src/modules/auth/auth.service.ts` | All auth business logic |
| `src/modules/auth/schemas/refresh-token.schema.ts` | `RefreshToken` Mongoose schema |
| `src/modules/auth/strategies/jwt.strategy.ts` | Passport JWT strategy |
| `src/modules/auth/strategies/local.strategy.ts` | Passport local strategy |
| `src/modules/auth/dto/register.dto.ts` | Registration DTO with validation |
| `src/modules/auth/dto/login.dto.ts` | Login DTO (email, password, remember_me) |
| `src/modules/auth/dto/verify-email.dto.ts` | Email verification DTO |
| `src/modules/auth/dto/refresh-token.dto.ts` | Refresh token DTO |
| `src/modules/auth/dto/forgot-password.dto.ts` | Forgot password DTO |
| `src/modules/auth/dto/reset-password.dto.ts` | Reset password DTO |
| `src/modules/auth/dto/enable-2fa.dto.ts` | 2FA verify DTO |

### User Module

| File | Purpose |
|------|---------|
| `src/modules/user/user.module.ts` | User module registration |
| `src/modules/user/user.service.ts` | User CRUD operations |
| `src/modules/user/schemas/user.schema.ts` | `User` Mongoose schema |

### Modified

| File | Changes |
|------|---------|
| `src/app.module.ts` | Added `AuthModule`, `UserModule`, `ThrottlerModule`, global `JwtAuthGuard`, `ThrottlerGuard` |
| `src/main.ts` | Added `ValidationPipe`, `ResponseInterceptor`, `GlobalExceptionFilter`, global prefix `api/v1` |
| `src/config/database.config.ts` | Removed strict MongooseModuleOptions type (was causing build error) |

---

## Existing Utils Used

| Util | Used For |
|------|----------|
| `BcryptPasswordHelper` | Password hashing (register, reset, change) and comparison (login) |
| `TOTPHelper` | 2FA secret generation, TOTP validation, OTP auth URL creation |
| `SMTPEmailer` + `EmailConfig` + `CommonEmailSendEntity` | Sending verification and password reset emails |
| `RandomNumberGenerator` | UUID generation for verification/reset tokens |
| `DateHelper` | Token expiry calculation (addHours, addMinutes, addDays) |
| `ErrorEntity` + `HttpStatus` | Consistent error responses across all services |
| `ResultEntity` | Consistent success responses via global interceptor |

---

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/auth/register` | Public | Register new user |
| 2 | POST | `/auth/verify-email` | Public | Verify email with token |
| 3 | POST | `/auth/resend-verification` | Public | Resend verification email |
| 4 | POST | `/auth/login` | Public | Login (returns access + refresh token) |
| 5 | POST | `/auth/refresh` | Public | Refresh access token |
| 6 | POST | `/auth/logout` | Bearer | Logout (revoke all refresh tokens) |
| 7 | POST | `/auth/forgot-password` | Public | Send password reset email |
| 8 | POST | `/auth/reset-password` | Public | Reset password with token |
| 9 | POST | `/auth/2fa/enable` | Bearer | Enable 2FA (returns secret + QR URL) |
| 10 | POST | `/auth/2fa/verify` | Bearer | Verify 2FA token and activate |
| 11 | POST | `/auth/2fa/disable` | Bearer | Disable 2FA |

---

## Response Format

### Success Response

```json
{
  "success": true,
  "code": 200,
  "description": "...",
  "data": { ... },
  "meta_data": null
}
```

### Error Response

```json
{
  "success": false,
  "code": 400,
  "error": {
    "error": "invalid_token",
    "error_description": "Invalid or expired verification token"
  }
}
```

### Validation Error Response

```json
{
  "success": false,
  "code": 400,
  "error": {
    "error": "bad_request",
    "error_description": "email must be an email, password must be longer than or equal to 8 characters"
  }
}
```

---

## How to Test Every API

### Prerequisites

1. Start MongoDB locally or update `MONGODB_URI` in `.env.development`
2. Run the app:

```bash
npm run start:dev
```

3. Open Swagger UI: `http://localhost:3000/api-docs`
4. Or use the cURL commands below

---

### 1. Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "StrongP@ss1"
  }'
```

**Expected:** `201` — user created, verification email sent

**Test cases:**
- Valid registration → success
- Duplicate email → `409 conflict`
- Missing fields → `400 bad_request` (validation)
- Password < 8 chars → `400 bad_request` (validation)

---

### 2. Verify Email

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token-from-email-or-db>"
  }'
```

**How to get token:** Check MongoDB `users` collection → `email_verification_token` field

**Test cases:**
- Valid token → `200` email verified
- Invalid/expired token → `400 invalid_token`
- Already verified user → token cleared, no effect

---

### 3. Resend Verification

```bash
curl -X POST http://localhost:3000/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Test cases:**
- Unverified user → new token generated, email sent
- Already verified → `400 already_verified`
- Non-existent email → `200` (same message to prevent enumeration)

---

### 4. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "StrongP@ss1",
    "remember_me": false
  }'
```

**Expected:** `200` — returns `access_token`, `refresh_token`, and `user` object

**Test cases:**
- Valid credentials (verified user) → tokens returned
- Invalid password → `401 unauthorized`
- Unverified email → `403 email_not_verified`
- Suspended account → `403 account_suspended`
- Locked account (5+ failed attempts) → `403 account_locked`
- `remember_me: true` → refresh token valid for 30 days instead of 7
- Rate limiting → 11th request within 60s → `429 too_many_requests`

---

### 5. Refresh Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh-token-from-login>"
  }'
```

**Expected:** `200` — returns new `access_token` + `refresh_token` (old one revoked)

**Test cases:**
- Valid refresh token → new pair returned
- Expired token → `401 invalid_token`
- Already revoked token → `401 token_revoked`
- Invalid string → `401 invalid_token`

---

### 6. Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <access-token>"
```

**Expected:** `200` — all refresh tokens for this user revoked

**Test cases:**
- With valid access token → success, all sessions revoked
- Without token → `401 unauthorized`
- Expired access token → `401 unauthorized`

---

### 7. Forgot Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Expected:** `200` — same message regardless of email existence (prevents enumeration)

**Test cases:**
- Existing email → reset token stored, email sent
- Non-existent email → same response (no leak)

---

### 8. Reset Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token-from-email-or-db>",
    "new_password": "NewStrongP@ss1"
  }'
```

**How to get token:** Check MongoDB `users` collection → `password_reset_token` field

**Test cases:**
- Valid token + strong password → password changed, all sessions revoked
- Invalid/expired token → `400 invalid_token`
- Weak password → `400 bad_request` (validation)
- Locked account → unlocked after reset

---

### 9. Enable 2FA

```bash
curl -X POST http://localhost:3000/api/v1/auth/2fa/enable \
  -H "Authorization: Bearer <access-token>"
```

**Expected:** `200` — returns `secret` (base32) and `otpauth_url` (for QR code)

**Test cases:**
- Authenticated user → secret + URL returned
- Already enabled → `400 2fa_already_enabled`
- No auth → `401 unauthorized`

---

### 10. Verify 2FA (Activate)

```bash
curl -X POST http://localhost:3000/api/v1/auth/2fa/verify \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<6-digit-totp-code>"
  }'
```

**How to get TOTP code:** Use the `secret` from enable step in any authenticator app (Google Authenticator, Authy) or use an online TOTP generator with the base32 secret.

**Test cases:**
- Valid TOTP code → 2FA activated
- Invalid code → `400 invalid_2fa_token`
- 2FA not initiated → `400 2fa_not_initiated`

---

### 11. Disable 2FA

```bash
curl -X POST http://localhost:3000/api/v1/auth/2fa/disable \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<6-digit-totp-code>"
  }'
```

**Test cases:**
- Valid TOTP code → 2FA disabled, secret cleared
- Invalid code → `400 invalid_2fa_token`
- 2FA not enabled → `400 2fa_not_enabled`

---

## Account Lock Flow (Test Scenario)

1. Register and verify a user
2. Attempt login with **wrong password 5 times**
3. On 5th attempt → account status changes to `locked`, `locked_until` set to 30 minutes from now
4. Attempt login with **correct password** → `403 account_locked` (with unlock time)
5. Wait 30 minutes (or manually clear `locked_until` in DB) → login works again
6. Alternatively, use **reset password** → unlocks the account

---

## Database Collections

After running Sprint 1, MongoDB will have these collections:

| Collection | Description |
|------------|-------------|
| `users` | User accounts with auth fields |
| `refreshtokens` | Hashed refresh tokens with expiry (TTL auto-cleanup) |

### Useful DB Queries for Testing

```javascript
// Find user by email
db.users.findOne({ email: "john@example.com" })

// Get verification token (for manual testing)
db.users.findOne({ email: "john@example.com" }, { email_verification_token: 1 })

// Get password reset token
db.users.findOne({ email: "john@example.com" }, { password_reset_token: 1 })

// Check failed login attempts
db.users.findOne({ email: "john@example.com" }, { failed_login_attempts: 1, locked_until: 1 })

// Manually unlock a user
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { failed_login_attempts: 0, locked_until: null, status: "active" } }
)

// Manually verify email (skip email)
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { is_verified: true, status: "active" } }
)

// Check active refresh tokens for a user
db.refreshtokens.find({ user_id: ObjectId("..."), is_revoked: false })

// Revoke all tokens for a user
db.refreshtokens.updateMany({ user_id: ObjectId("...") }, { $set: { is_revoked: true } })
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `APP_NAME` | `NestJSApp` | App name (used in 2FA issuer) |
| `APP_URL` | `http://localhost:3000` | Backend URL (for email links) |
| `FRONTEND_URL` | `http://localhost:4200` | Frontend URL (for password reset links) |
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB_NAME` | `nestjs_app` | Database name |
| `JWT_ACCESS_SECRET` | `access-secret-change-me` | Access token signing secret |
| `JWT_REFRESH_SECRET` | `refresh-secret-change-me` | Refresh token signing secret |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token expiry (human readable) |
| `JWT_ACCESS_EXPIRES_IN_SEC` | `900` | Access token expiry (seconds) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |
| `JWT_REFRESH_EXPIRES_IN_SEC` | `604800` | Refresh token expiry (seconds) |
| `JWT_REFRESH_EXPIRES_IN_REMEMBER` | `30d` | Remember me expiry |
| `JWT_REFRESH_EXPIRES_IN_REMEMBER_SEC` | `2592000` | Remember me expiry (seconds) |
| `SMTP_HOST` | — | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` | `noreply@app.com` | From email address |
| `BCRYPT_SALT_ROUND` | `10` | Bcrypt salt rounds |
| `SWAGGER_ENABLED` | `true` | Enable Swagger UI |

---

## Feature Implementation Details

### JWT Token Strategy

- **Access Token:** Short-lived (15m default), stored in client memory, sent via `Authorization: Bearer` header
- **Refresh Token:** Long-lived (7d or 30d with remember me), stored hashed in DB, sent in request body
- **Token Rotation:** On refresh, old token is revoked and new pair is issued (prevents reuse)
- **Logout:** Revokes all refresh tokens for the user (all devices)

### Password Security

- **Hashing:** bcrypt with configurable salt rounds (default 10)
- **Minimum Length:** 8 characters (enforced by `class-validator`)
- **Account Lock:** After 5 failed attempts → locked for 30 minutes
- **Reset:** Password reset clears lock status and revokes all sessions

### Email Verification Flow

```
Register → status: "pending" → verification email sent
    ↓
Click verify link → status: "active" → can now login
    ↓
(If not verified) → login returns "403 email_not_verified"
```

### Password Reset Flow

```
Forgot Password → reset token generated (1hr expiry) → email sent
    ↓
Reset Password (with token) → password changed → all sessions revoked → account unlocked if locked
```

### 2FA Flow

```
POST /2fa/enable → returns secret + otpauth_url
    ↓
Add secret to authenticator app (Google Authenticator, Authy)
    ↓
POST /2fa/verify → validates TOTP code → 2FA activated
    ↓
(To disable) POST /2fa/disable → validates TOTP code → 2FA removed
```

### Rate Limiting

- Global: 10 requests per 60 seconds per IP
- Exceeding limit returns `429 too_many_requests`

### Unified Response Format

- All success responses wrapped via `ResponseInterceptor` → `ResultEntity`
- All errors caught by `GlobalExceptionFilter` → `ResultEntity` + `ErrorEntity`
- Validation errors from `class-validator` are caught and formatted consistently
- Custom `ErrorEntity` thrown from services with specific `error` codes for client handling

---

## Swagger UI

After starting the app, visit:

```
http://localhost:3000/api-docs
```

- All endpoints are documented with request/response schemas
- Use "Authorize" button (top right) to set Bearer token after login
- Public endpoints work without authorization
