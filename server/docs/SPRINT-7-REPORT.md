# Sprint 7 — User Status & Notifications (Complete)

## Summary

Sprint 7 introduces a centralized **Notification Module** with styled HTML email templates, replacing all inline email HTML across the codebase. Emails are now preference-aware — users control which optional notifications they receive via `notification_preferences`. The **User Status** tasks from the sprint plan were already completed in prior sprints (status enum, auto-lock, auto-pending, admin status change).

---

## Files Created / Modified

### New — Notification Module (3 files)

| File | Purpose |
|------|---------|
| `src/modules/notification/notification.module.ts` | Module registration, exports NotificationService |
| `src/modules/notification/notification.service.ts` | Centralized email service with 8 notification methods |
| `src/modules/notification/email-templates.ts` | 8 styled HTML email templates with shared layout |

### Modified

| File | Changes |
|------|---------|
| `src/modules/auth/auth.service.ts` | Replaced inline `sendVerificationEmail()` and `sendPasswordResetEmail()` private methods with `NotificationService`. Added: welcome email on verify, account locked email on lockout, new login alert on login, password changed + security alert on reset, security alerts on 2FA changes. Removed `SMTPEmailer`, `CommonEmailSendEntity`, `EmailConfig` imports. |
| `src/modules/auth/auth.module.ts` | Imported `NotificationModule` |
| `src/modules/user/user-profile.service.ts` | Replaced inline `sendVerificationEmail()` private method with `NotificationService.sendEmailUpdateVerification()`. Added `sendPasswordChangedEmail()` call on self-service password change. Removed `SMTPEmailer`, `CommonEmailSendEntity`, `EmailConfig` imports. |
| `src/modules/user/user.module.ts` | Imported `NotificationModule` |

---

## Existing Utils Used

| Util | Used For |
|------|----------|
| `SMTPEmailer` | Core email transport (used inside NotificationService) |
| `CommonEmailSendEntity` | Email payload structure |
| `EmailConfig` | SMTP configuration |
| `UserAgentHelper` | Parsing user agent for new login email (device/browser/OS details) |
| `ErrorEntity` + `HttpStatus` | All error responses |
| `ResultEntity` | All success responses via global interceptor |

---

## Notification Service — 8 Email Methods

| # | Method | Subject | Preference Gate | Triggered By |
|---|--------|---------|----------------|-------------|
| 1 | `sendVerificationEmail()` | Verify Your Email | Always sent | Registration, resend verification |
| 2 | `sendEmailUpdateVerification()` | Verify Your New Email | Always sent | Email change (user profile) |
| 3 | `sendPasswordResetEmail()` | Reset Your Password | Always sent | Forgot password |
| 4 | `sendPasswordChangedEmail()` | Your Password Was Changed | `email_on_password_change` | Self-service password change, password reset |
| 5 | `sendNewLoginEmail()` | New Login to Your Account | `email_on_login` | Successful login |
| 6 | `sendSecurityAlertEmail()` | Security Alert: {event} | `email_on_security_alert` | Password reset, 2FA enable/disable |
| 7 | `sendWelcomeEmail()` | Welcome to {APP_NAME}! | Always sent | Email verification (first time) |
| 8 | `sendAccountLockedEmail()` | Your Account Has Been Locked | Always sent | Failed login attempts reach limit |

### Preference Gate Logic

- **Always sent** — Critical or user-requested emails that should never be suppressed
- **Preference-gated** — Optional notifications controlled by `user.notification_preferences`
- If preferences are not set, defaults are used: `email_on_login: false`, `email_on_password_change: true`, `email_on_security_alert: true`

---

## Email Templates

All templates use a shared HTML layout with:
- **Branded header** — App name on indigo (#4F46E5) background
- **Content body** — Clean typography, styled info boxes, CTA buttons
- **Footer** — Copyright notice + automated message disclaimer
- **Responsive** — 600px max-width table layout, works in all email clients
- **Configurable** — App name via `APP_NAME` env variable

### Template Details

#### 1. Email Verification
- Personalized greeting with user's first name
- Styled "Verify Email" button
- Fallback URL as plain text link
- Expiry notice (24 hours)

#### 2. Email Update Verification
- Shows the new email address being verified
- Styled "Verify New Email" button
- Fallback URL + 24h expiry

#### 3. Password Reset
- Styled "Reset Password" button
- Fallback URL + 1h expiry
- Notice: "If you did not request this, please ignore"

#### 4. Password Changed
- Timestamp of change
- IP address (when available)
- Red warning: "If you did not make this change, reset your password immediately"

#### 5. New Login Alert
- Device name, browser + version, OS + version
- IP address
- Location (when available from IP geolocation)
- Login timestamp
- Red warning: "If this wasn't you, change your password"

#### 6. Security Alert
- Event name (bold, red background)
- Description of what happened
- Timestamp + IP (when available)
- Red warning: "If you did not perform this action, secure your account"

#### 7. Welcome
- Congratulatory message after email verification
- "Go to Login" button
- Support contact mention

#### 8. Account Locked
- Number of failed attempts that caused the lock
- Lock expiry timestamp (red highlighted)
- Instructions to wait or reset password
- Warning about potential unauthorized access

---

## Notification Integration Points

### AuthService — Where Notifications Fire

| Action | Notifications Sent |
|--------|-------------------|
| `register()` | Email Verification |
| `verifyEmail()` | Welcome |
| `resendVerification()` | Email Verification |
| `validateUser()` — account locked | Account Locked |
| `login()` | New Login Alert (preference-gated) |
| `forgotPassword()` | Password Reset |
| `resetPassword()` | Password Changed + Security Alert: Password Reset (preference-gated) |
| `verify2fa()` | Security Alert: 2FA Enabled (preference-gated) |
| `disable2fa()` | Security Alert: 2FA Disabled (preference-gated) |

### UserProfileService — Where Notifications Fire

| Action | Notifications Sent |
|--------|-------------------|
| `updateEmail()` | Email Update Verification |
| `changePassword()` | Password Changed (preference-gated) |

### Non-blocking Sends

Login and security alert notifications are called without `await` to avoid blocking the API response. This is intentional — the user should not wait for an email to be sent before receiving their login tokens.

---

## User Notification Preferences

### Schema (already existed in User schema)

```typescript
notification_preferences: {
    email_on_login: boolean;        // default: false
    email_on_password_change: boolean;  // default: true
    email_on_security_alert: boolean;   // default: true
}
```

### API Endpoint (already existed)

```bash
PATCH /api/v1/user/notifications
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
    "email_on_login": true,
    "email_on_password_change": true,
    "email_on_security_alert": true
}
```

Permission: `user:update`

---

## How to Test

### Prerequisites

1. Start MongoDB + run `npm run start:dev`
2. Configure SMTP in `.env.development`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your@gmail.com
   APP_NAME=MyApp
   ```
3. Login and save the `access_token`

---

### Step 1: Test Email Verification Template

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Expected:** Styled HTML email with "Verify Email" button sent to `test@example.com`

---

### Step 2: Test Welcome Email

Click the verification link from the email (or use the API):

```bash
curl -X GET "http://localhost:3000/api/v1/auth/verify-email?token=<TOKEN>"
```

**Expected:** Welcome email sent after successful verification

---

### Step 3: Test Password Reset Email

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com" }'
```

**Expected:** Styled HTML email with "Reset Password" button

---

### Step 4: Test Password Changed + Security Alert Emails

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<RESET_TOKEN>",
    "new_password": "NewPass456"
  }'
```

**Expected:** Two emails — "Your Password Was Changed" + "Security Alert: Password Reset"

---

### Step 5: Test New Login Alert

First, enable login notifications:

```bash
curl -X PATCH http://localhost:3000/api/v1/user/notifications \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "email_on_login": true }'
```

Then login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0" \
  -d '{
    "email": "test@example.com",
    "password": "NewPass456",
    "remember_me": false
  }'
```

**Expected:** "New Login to Your Account" email with device/browser/OS/IP details

---

### Step 6: Test Security Alert (2FA)

```bash
# Enable 2FA
curl -X POST http://localhost:3000/api/v1/auth/2fa/enable \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Verify 2FA
curl -X POST http://localhost:3000/api/v1/auth/2fa/verify \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "token": "<TOTP_TOKEN>" }'
```

**Expected:** "Security Alert: 2FA Enabled" email

```bash
# Disable 2FA
curl -X POST http://localhost:3000/api/v1/auth/2fa/disable \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "token": "<TOTP_TOKEN>" }'
```

**Expected:** "Security Alert: 2FA Disabled" email

---

### Step 7: Test Account Locked Email

```bash
# Send 5 failed login attempts
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "WrongPassword",
      "remember_me": false
    }'
done
```

**Expected:** "Your Account Has Been Locked" email after the 5th failed attempt

---

### Step 8: Test Email Update Verification

```bash
curl -X PATCH http://localhost:3000/api/v1/user/email \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "new_email": "newemail@example.com",
    "password": "NewPass456"
  }'
```

**Expected:** "Verify Your New Email" email sent to `newemail@example.com`

---

### Step 9: Test Self-Service Password Change Notification

```bash
curl -X PATCH http://localhost:3000/api/v1/user/password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "NewPass456",
    "new_password": "AnotherPass789"
  }'
```

**Expected:** "Your Password Was Changed" email (if `email_on_password_change` is true)

---

### Step 10: Test Preference Toggling

```bash
# Disable all optional notifications
curl -X PATCH http://localhost:3000/api/v1/user/notifications \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email_on_login": false,
    "email_on_password_change": false,
    "email_on_security_alert": false
  }'

# Now login — should NOT receive a login alert email
# Now change password — should NOT receive a password changed email
```

---

## Sprint 7 Task Completion

### User Status (from Sprint Plan)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Status enum (active, inactive, suspended, pending, locked) | ✅ Done in Sprint 1 | `UserStatus` enum |
| 2 | Status transitions with validation | ✅ Done in Sprint 1 + 4 | Auth + Admin services |
| 3 | Auto-lock on failed attempts | ✅ Done in Sprint 1 | `validateUser()` in AuthService |
| 4 | Auto-pending on registration | ✅ Done in Sprint 1 | `register()` sets `PENDING` |
| 5 | Admin status change | ✅ Done in Sprint 4 | Admin user management |

### Notifications (from Sprint Plan)

| # | Task | Status |
|---|------|--------|
| 1 | Email template service | ✅ `NotificationService` + `email-templates.ts` |
| 2 | Account verification email | ✅ `emailVerificationTemplate` |
| 3 | Password reset email | ✅ `passwordResetTemplate` |
| 4 | New user invitation email | ⏭️ Sprint 10 (invitation system) |
| 5 | Security alert email (new device login) | ✅ `newLoginTemplate` + `securityAlertTemplate` |
| 6 | Admin notification (new user, suspicious activity) | ⏭️ Sprint 8 (audit logging) |
| 7 | Notification preferences (email on/off) | ✅ Preference-gated sending implemented |

---

## Architecture — Before vs After

### Before (Sprint 1–6)

```
AuthService
├── sendVerificationEmail()     ← inline HTML, duplicated EmailConfig
└── sendPasswordResetEmail()    ← inline HTML, duplicated EmailConfig

UserProfileService
└── sendVerificationEmail()     ← inline HTML, duplicated EmailConfig
```

- 3 separate private methods with duplicated SMTP config
- Raw inline HTML strings (no styling, no personalization)
- No preference checking
- No login/security/welcome/locked notifications

### After (Sprint 7)

```
NotificationModule
└── NotificationService
    ├── send()                          ← centralized SMTP sender
    ├── sendVerificationEmail()         ← always
    ├── sendEmailUpdateVerification()   ← always
    ├── sendPasswordResetEmail()        ← always
    ├── sendPasswordChangedEmail()      ← preference-gated
    ├── sendNewLoginEmail()             ← preference-gated
    ├── sendSecurityAlertEmail()        ← preference-gated
    ├── sendWelcomeEmail()              ← always
    └── sendAccountLockedEmail()        ← always

email-templates.ts
├── layout()                    ← shared HTML wrapper (header, footer, branding)
├── button()                    ← reusable CTA button component
├── emailVerificationTemplate()
├── emailUpdateVerificationTemplate()
├── passwordResetTemplate()
├── passwordChangedTemplate()
├── newLoginTemplate()
├── securityAlertTemplate()
├── welcomeTemplate()
└── accountLockedTemplate()
```

- Single source of truth for SMTP config
- Styled, branded HTML templates with shared layout
- User preference awareness
- 8 distinct notification types covering all user lifecycle events
- Non-blocking sends for login and security alerts

---

## Environment Variables

| Variable | Default | Used For |
|----------|---------|----------|
| `SMTP_HOST` | (required) | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | (optional) | SMTP authentication username |
| `SMTP_PASS` | (optional) | SMTP authentication password |
| `SMTP_FROM` | `noreply@app.com` | Default sender address |
| `APP_NAME` | `NestJS App` | Used in email branding and subjects |
| `APP_URL` | `http://localhost:3000` | Base URL for verification links |
| `FRONTEND_URL` | Falls back to `APP_URL` | Base URL for password reset + login links |

---

## Swagger UI

After starting the app, visit: `http://localhost:3000/api-docs`

No new endpoints — notifications are triggered automatically by existing endpoints. The existing `PATCH /user/notifications` endpoint controls preferences.
