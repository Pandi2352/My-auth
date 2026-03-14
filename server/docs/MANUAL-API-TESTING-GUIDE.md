# Manual API Testing Guide — Sprint 1 & Sprint 2

Complete step-by-step guide to manually test every API endpoint in order. Follow the steps sequentially — each step builds on the previous one.

---

## Prerequisites

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Copy environment file (if not done)
cp .env.development .env
```

### 2. Required Services

- **MongoDB** running locally on `mongodb://localhost:27017` (or update `MONGODB_URI` in `.env`)
- **SMTP server** (optional — for email testing). Without SMTP, get tokens directly from MongoDB

### 3. Start the Application

```bash
npm run start:dev
```

### 4. Tools

- **Swagger UI:** `http://localhost:3000/api-docs` (recommended for quick testing)
- **cURL** (used in this guide)
- **Postman** / **Insomnia** (alternative)
- **MongoDB Compass** or **mongosh** (to inspect DB directly)

### 5. Base URL

```
http://localhost:3000/api/v1
```

---

## Response Format (All APIs)

Every API returns the same structure:

**Success:**
```json
{
  "success": true,
  "code": 200,
  "description": "...",
  "data": { ... },
  "meta_data": null
}
```

**Error:**
```json
{
  "success": false,
  "code": 400,
  "error": {
    "error": "error_code",
    "error_description": "Human readable message"
  }
}
```

---

# SPRINT 1 — Authentication APIs

---

## Step 1: Register a New User

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

**Expected:** `201` — User created, verification email sent (or logged to console if no SMTP)

**Save:** Note the response — user is created with `status: "pending"`

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid registration | `201` success |
| 2 | Same email again | `409` — `email_already_exists` |
| 3 | Missing `email` field | `400` — validation error |
| 4 | Missing `password` field | `400` — validation error |
| 5 | Password `"short"` (< 8 chars) | `400` — validation error |
| 6 | Missing `first_name` | `400` — validation error |

---

## Step 2: Get Verification Token from DB

Since SMTP may not be configured, get the token directly from MongoDB:

```javascript
// In mongosh or Compass
db.users.findOne(
  { email: "john@example.com" },
  { email_verification_token: 1, status: 1, is_verified: 1 }
)
```

**Save:** Copy the `email_verification_token` value

---

## Step 3: Verify Email

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<PASTE_TOKEN_FROM_STEP_2>"
  }'
```

**Expected:** `200` — Email verified, user status changes to `active`

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid token | `200` — email verified |
| 2 | Same token again | `400` — `invalid_token` (already used) |
| 3 | Random/fake token | `400` — `invalid_token` |
| 4 | Empty token | `400` — validation error |

### Verify in DB:
```javascript
db.users.findOne(
  { email: "john@example.com" },
  { status: 1, is_verified: 1, email_verification_token: 1 }
)
// Expected: status: "active", is_verified: true, email_verification_token: null
```

---

## Step 4: Resend Verification (Optional)

Register a second user to test this:

```bash
# Register another user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "password": "StrongP@ss1"
  }'

# Resend verification
curl -X POST http://localhost:3000/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com"
  }'
```

**Expected:** `200` — New verification token generated

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Unverified user email | `200` — new token sent |
| 2 | Already verified user (john@example.com) | `400` — `already_verified` |
| 3 | Non-existent email | `200` — same message (prevents email enumeration) |

---

## Step 5: Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "StrongP@ss1",
    "remember_me": false
  }'
```

**Expected:** `200` — Returns `access_token`, `refresh_token`, and `user` object

**IMPORTANT — Save these values:**
```
access_token  = <copy this — used for ALL protected endpoints>
refresh_token = <copy this — used for refresh test>
```

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid credentials | `200` — tokens returned |
| 2 | Wrong password | `401` — `unauthorized` |
| 3 | Non-existent email | `401` — `unauthorized` |
| 4 | Unverified user (jane@example.com) | `403` — `email_not_verified` |
| 5 | `remember_me: true` | `200` — refresh token valid for 30d instead of 7d |
| 6 | Missing password | `400` — validation error |

### Verify in DB:
```javascript
// Check last login was recorded
db.users.findOne(
  { email: "john@example.com" },
  { last_login_at: 1, last_login_ip: 1 }
)

// Check refresh token was stored
db.refreshtokens.find({ is_revoked: false }).sort({ created_at: -1 }).limit(1)
```

---

## Step 6: Refresh Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<PASTE_REFRESH_TOKEN_FROM_STEP_5>"
  }'
```

**Expected:** `200` — New `access_token` + `refresh_token` pair (old refresh token revoked)

**IMPORTANT:** Update your saved tokens with the new ones!

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid refresh token | `200` — new token pair |
| 2 | Same token again (already revoked) | `401` — `token_revoked` |
| 3 | Random/fake token | `401` — `invalid_token` |
| 4 | Empty string | `400` — validation error |

---

## Step 7: Test Protected Endpoint (Quick Check)

Use the access token to call any protected endpoint:

```bash
# This should work — returns user profile
curl -X GET http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# This should fail — no token
curl -X GET http://localhost:3000/api/v1/user/profile

# This should fail — invalid token
curl -X GET http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer invalid-token-here"
```

| # | Test | Expected |
|---|------|----------|
| 1 | Valid Bearer token | `200` — profile data |
| 2 | No Authorization header | `401` — unauthorized |
| 3 | Invalid/expired token | `401` — unauthorized |

---

## Step 8: Forgot Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Expected:** `200` — Reset email sent (same message for any email to prevent enumeration)

### Get reset token from DB:
```javascript
db.users.findOne(
  { email: "john@example.com" },
  { password_reset_token: 1, password_reset_expires: 1 }
)
```

**Save:** Copy the `password_reset_token` value

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Existing email | `200` — token generated |
| 2 | Non-existent email | `200` — same response (no enumeration) |

---

## Step 9: Reset Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<PASTE_RESET_TOKEN_FROM_STEP_8>",
    "new_password": "NewStrongP@ss2"
  }'
```

**Expected:** `200` — Password changed, all refresh tokens revoked

**IMPORTANT:** Your old password is now `NewStrongP@ss2`. You need to login again.

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid token + strong password | `200` — password reset |
| 2 | Same token again | `400` — `invalid_token` (already used) |
| 3 | Fake token | `400` — `invalid_token` |
| 4 | Password < 8 chars | `400` — validation error |

### Re-login with new password:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "NewStrongP@ss2",
    "remember_me": false
  }'
```

**Save:** Update your `access_token` and `refresh_token`

---

## Step 10: Account Locking (5 Failed Attempts)

```bash
# Attempt login with wrong password 5 times
for i in 1 2 3 4 5; do
  echo "--- Attempt $i ---"
  curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "john@example.com",
      "password": "WrongPassword123",
      "remember_me": false
    }'
  echo ""
done
```

**Expected after 5th attempt:** Account locked for 30 minutes

```bash
# Now try with CORRECT password — should still be locked
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "NewStrongP@ss2",
    "remember_me": false
  }'
```

**Expected:** `403` — `account_locked` with unlock time

### Verify in DB:
```javascript
db.users.findOne(
  { email: "john@example.com" },
  { failed_login_attempts: 1, locked_until: 1, status: 1 }
)
// Expected: failed_login_attempts: 5, status: "locked", locked_until: <30 min from now>
```

### Unlock manually (for continued testing):
```javascript
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { failed_login_attempts: 0, locked_until: null, status: "active" } }
)
```

### Re-login after unlock:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "NewStrongP@ss2",
    "remember_me": false
  }'
```

**Save:** Update your `access_token` and `refresh_token`

---

## Step 11: Enable 2FA

```bash
curl -X POST http://localhost:3000/api/v1/auth/2fa/enable \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Returns `secret` (base32) and `otpauth_url`

**Save:** Copy the `secret` value — you need it for the next step

### How to get the TOTP code:
- **Option A:** Add the `secret` to Google Authenticator / Authy app
- **Option B:** Use an online TOTP generator (search "TOTP generator online") and paste the `secret`
- **Option C:** Use the `otpauth_url` to generate a QR code and scan it

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Authenticated user | `200` — secret + URL |
| 2 | No token | `401` — unauthorized |

---

## Step 12: Verify 2FA (Activate)

```bash
curl -X POST http://localhost:3000/api/v1/auth/2fa/verify \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<6_DIGIT_TOTP_CODE>"
  }'
```

**Expected:** `200` — 2FA now active on the account

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid TOTP code | `200` — 2FA activated |
| 2 | Wrong/expired code | `400` — `invalid_2fa_token` |
| 3 | Enable again (already enabled) | `400` — `2fa_already_enabled` |

### Verify in DB:
```javascript
db.users.findOne(
  { email: "john@example.com" },
  { is_2fa_enabled: 1, two_fa_secret: 1 }
)
// Expected: is_2fa_enabled: true, two_fa_secret: <encrypted secret>
```

---

## Step 13: Disable 2FA

```bash
curl -X POST http://localhost:3000/api/v1/auth/2fa/disable \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<6_DIGIT_TOTP_CODE>"
  }'
```

**Expected:** `200` — 2FA disabled, secret cleared

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid TOTP code | `200` — 2FA disabled |
| 2 | Wrong code | `400` — `invalid_2fa_token` |
| 3 | Disable again (not enabled) | `400` — `2fa_not_enabled` |

---

## Step 14: Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — All refresh tokens revoked for this user

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid access token | `200` — logged out |
| 2 | No token | `401` — unauthorized |

### Verify in DB:
```javascript
// All refresh tokens should be revoked
db.refreshtokens.find({ is_revoked: false })
// Expected: none for this user
```

### Re-login for Sprint 2 testing:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "NewStrongP@ss2",
    "remember_me": false
  }'
```

**Save:** Update your `access_token` — needed for ALL Sprint 2 APIs

---

## Step 15: Rate Limiting Test

```bash
# Send 11 requests rapidly (limit is 10/60s)
for i in $(seq 1 11); do
  echo "--- Request $i ---"
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "john@example.com",
      "password": "NewStrongP@ss2",
      "remember_me": false
    }'
  echo ""
done
```

**Expected:** First 10 return `200`/`401`, 11th returns `429` (Too Many Requests)

---

# SPRINT 2 — User Profile APIs

> **Prerequisite:** You must be logged in with a valid `access_token` from Sprint 1.
> All Sprint 2 endpoints require: `Authorization: Bearer <ACCESS_TOKEN>`

---

## Step 16: Get Profile

```bash
curl -X GET http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Full profile with sensitive fields excluded

**Verify these fields are NOT in the response:**
- `password_hash`
- `email_verification_token` / `email_verification_expires`
- `password_reset_token` / `password_reset_expires`
- `two_fa_secret`
- `failed_login_attempts` / `locked_until`
- `is_deleted` / `deleted_at`

**Verify these fields ARE in the response:**
- `_id`, `first_name`, `last_name`, `email`, `phone`
- `avatar_url`, `status`, `is_verified`, `is_2fa_enabled`
- `notification_preferences`, `last_login_at`, `last_login_ip`
- `created_at`, `updated_at`

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid token | `200` — profile data |
| 2 | No token | `401` — unauthorized |
| 3 | Expired/invalid token | `401` — unauthorized |

---

## Step 17: Update Profile (Name & Phone)

```bash
curl -X PATCH http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Johnny",
    "last_name": "Updated",
    "phone": "+919876543210"
  }'
```

**Expected:** `200` — Updated profile returned

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Update all three fields | `200` — all fields updated |
| 2 | Update only `first_name` | `200` — only first_name changes |
| 3 | Update only `phone` | `200` — only phone changes |
| 4 | Empty body `{}` | `200` — no changes (all fields optional) |
| 5 | No token | `401` — unauthorized |

### Verify in DB:
```javascript
db.users.findOne(
  { email: "john@example.com" },
  { first_name: 1, last_name: 1, phone: 1 }
)
```

---

## Step 18: Update Phone Number

```bash
curl -X PATCH http://localhost:3000/api/v1/user/phone \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+911234567890"
  }'
```

**Expected:** `200` — Updated profile with new phone

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid phone | `200` — phone updated |
| 2 | Empty phone | `400` — validation error |
| 3 | No token | `401` — unauthorized |

---

## Step 19: Upload Avatar

```bash
curl -X POST http://localhost:3000/api/v1/user/profile/avatar \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "avatar=@/path/to/your/image.jpg"
```

> Replace `/path/to/your/image.jpg` with an actual image file path on your machine.

**Expected:** `200` — Returns `avatar_url`

```json
{
  "success": true,
  "code": 200,
  "data": {
    "message": "Avatar uploaded successfully",
    "avatar_url": "uploads/avatars/550e8400-e29b-41d4-a716-446655440000.jpg"
  }
}
```

**View the uploaded avatar:** Open `http://localhost:3000/<avatar_url>` in browser

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid image (jpg/png/gif/webp) | `200` — uploaded |
| 2 | Non-image file (`.pdf`, `.txt`) | `400` — only image files allowed |
| 3 | File > 5MB | `400` — file too large |
| 4 | No file attached | `400` — `no_file` |
| 5 | Upload again (replace) | `200` — old file deleted, new file saved |
| 6 | No token | `401` — unauthorized |

### Verify:
```javascript
// Check avatar_url in DB
db.users.findOne({ email: "john@example.com" }, { avatar_url: 1 })
```

```bash
# Check file exists on disk
ls uploads/avatars/
```

---

## Step 20: Get Profile (Verify Avatar)

```bash
curl -X GET http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Verify:** `avatar_url` field now has the uploaded file path

---

## Step 21: Remove Avatar

```bash
curl -X DELETE http://localhost:3000/api/v1/user/profile/avatar \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Avatar file deleted from disk, `avatar_url` cleared

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | User has avatar | `200` — file deleted, field cleared |
| 2 | Call again (no avatar) | `200` — no-op, still success |
| 3 | No token | `401` — unauthorized |

### Verify:
```javascript
db.users.findOne({ email: "john@example.com" }, { avatar_url: 1 })
// Expected: avatar_url is null/undefined
```

```bash
# File should be deleted from disk
ls uploads/avatars/
```

---

## Step 22: Update Notification Preferences

```bash
curl -X PATCH http://localhost:3000/api/v1/user/notifications \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email_on_login": true,
    "email_on_password_change": true,
    "email_on_security_alert": false
  }'
```

**Expected:** `200` — Updated preferences returned

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Update all three | `200` — all updated |
| 2 | Update only `email_on_login` | `200` — only that one changes, others remain |
| 3 | Empty body `{}` | `200` — no changes |
| 4 | Invalid type `"email_on_login": "yes"` | `400` — validation error |
| 5 | No token | `401` — unauthorized |

### Verify in DB:
```javascript
db.users.findOne(
  { email: "john@example.com" },
  { notification_preferences: 1 }
)
```

---

## Step 23: Change Password

```bash
curl -X PATCH http://localhost:3000/api/v1/user/password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "NewStrongP@ss2",
    "new_password": "FinalP@ssword3"
  }'
```

**Expected:** `200` — Password changed

**IMPORTANT:** Your password is now `FinalP@ssword3`

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Correct current + valid new | `200` — password changed |
| 2 | Wrong current password | `401` — `invalid_password` |
| 3 | New = same as current | `400` — `same_password` |
| 4 | New password < 8 chars | `400` — validation error |
| 5 | No token | `401` — unauthorized |

### Verify — login with new password:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "FinalP@ssword3",
    "remember_me": false
  }'
```

**Save:** Update your `access_token`

---

## Step 24: Update Email (Triggers Re-verification)

> **WARNING:** After this step, the user CANNOT login until re-verifying the new email.

```bash
curl -X PATCH http://localhost:3000/api/v1/user/email \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "new_email": "john.new@example.com",
    "password": "FinalP@ssword3"
  }'
```

**Expected:** `200` — Email changed, user status set to `pending`, verification email sent

### Test cases to try:

| # | Test | Expected |
|---|------|----------|
| 1 | Valid new email + correct password | `200` — email updated, re-verification required |
| 2 | Wrong password | `401` — `invalid_password` |
| 3 | Same as current email | `400` — `same_email` |
| 4 | Email already taken | `409` — `email_taken` |
| 5 | Invalid email format | `400` — validation error |

### Verify in DB:
```javascript
db.users.findOne(
  { email: "john.new@example.com" },
  { status: 1, is_verified: 1, email_verification_token: 1 }
)
// Expected: status: "pending", is_verified: false
```

---

## Step 25: Verify Login Blocked After Email Change

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.new@example.com",
    "password": "FinalP@ssword3",
    "remember_me": false
  }'
```

**Expected:** `403` — `email_not_verified`

---

## Step 26: Re-verify New Email

### Get the new verification token:
```javascript
db.users.findOne(
  { email: "john.new@example.com" },
  { email_verification_token: 1 }
)
```

### Verify the new email:
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<PASTE_NEW_VERIFICATION_TOKEN>"
  }'
```

**Expected:** `200` — Email verified, user is active again

---

## Step 27: Login with New Email

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.new@example.com",
    "password": "FinalP@ssword3",
    "remember_me": false
  }'
```

**Expected:** `200` — Login successful with new email

---

# Quick Reference — All Endpoints

## Sprint 1 — Auth (11 endpoints)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 1 | POST | `/auth/register` | Public | Register new user |
| 2 | POST | `/auth/verify-email` | Public | Verify email with token |
| 3 | POST | `/auth/resend-verification` | Public | Resend verification email |
| 4 | POST | `/auth/login` | Public | Login → get tokens |
| 5 | POST | `/auth/refresh` | Public | Refresh access token |
| 6 | POST | `/auth/logout` | Bearer | Revoke all sessions |
| 7 | POST | `/auth/forgot-password` | Public | Send reset email |
| 8 | POST | `/auth/reset-password` | Public | Reset password with token |
| 9 | POST | `/auth/2fa/enable` | Bearer | Enable 2FA → get secret |
| 10 | POST | `/auth/2fa/verify` | Bearer | Verify TOTP → activate 2FA |
| 11 | POST | `/auth/2fa/disable` | Bearer | Disable 2FA |

## Sprint 2 — User Profile (8 endpoints)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 12 | GET | `/user/profile` | Bearer | View own profile |
| 13 | PATCH | `/user/profile` | Bearer | Edit name/phone |
| 14 | PATCH | `/user/email` | Bearer | Change email (re-verification) |
| 15 | PATCH | `/user/phone` | Bearer | Update phone number |
| 16 | PATCH | `/user/password` | Bearer | Change password |
| 17 | POST | `/user/profile/avatar` | Bearer | Upload avatar image |
| 18 | DELETE | `/user/profile/avatar` | Bearer | Remove avatar |
| 19 | PATCH | `/user/notifications` | Bearer | Update notification preferences |

---

# Useful MongoDB Queries

```javascript
// ── View full user data ──
db.users.findOne({ email: "john.new@example.com" })

// ── Safe profile view (what API returns) ──
db.users.findOne(
  { email: "john.new@example.com" },
  {
    password_hash: 0,
    email_verification_token: 0,
    email_verification_expires: 0,
    password_reset_token: 0,
    password_reset_expires: 0,
    two_fa_secret: 0,
    failed_login_attempts: 0,
    locked_until: 0,
    is_deleted: 0,
    deleted_at: 0
  }
)

// ── Get verification token ──
db.users.findOne({ email: "john@example.com" }, { email_verification_token: 1 })

// ── Get password reset token ──
db.users.findOne({ email: "john@example.com" }, { password_reset_token: 1 })

// ── Check account lock status ──
db.users.findOne({ email: "john@example.com" }, { failed_login_attempts: 1, locked_until: 1, status: 1 })

// ── Manually unlock account ──
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { failed_login_attempts: 0, locked_until: null, status: "active" } }
)

// ── Manually verify email (skip SMTP) ──
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { is_verified: true, status: "active", email_verification_token: null } }
)

// ── Check notification preferences ──
db.users.findOne({ email: "john@example.com" }, { notification_preferences: 1 })

// ── Check avatar ──
db.users.findOne({ email: "john@example.com" }, { avatar_url: 1 })

// ── View active refresh tokens ──
db.refreshtokens.find({ is_revoked: false })

// ── Clean up — delete all test data ──
db.users.deleteMany({})
db.refreshtokens.deleteMany({})
```

---

# Password Tracking

As you test, the password changes. Here's the sequence:

| Step | Password | How It Changed |
|------|----------|----------------|
| Step 1 (Register) | `StrongP@ss1` | Initial registration |
| Step 9 (Reset Password) | `NewStrongP@ss2` | Forgot + reset password |
| Step 23 (Change Password) | `FinalP@ssword3` | Changed via profile API |

Final credentials at end of all tests:
- **Email:** `john.new@example.com`
- **Password:** `FinalP@ssword3`
