# Sprint 2 — User Profile Management (Complete)

## Summary

Sprint 2 delivers the full user profile management module allowing authenticated users to view and edit their profile, update email (with re-verification), change password, upload/remove avatar, update phone number, and manage notification preferences. All endpoints are protected by JWT and use the unified `ResultEntity`/`ErrorEntity` response format.

---

## Files Created / Modified

### New Files

| File | Purpose |
|------|---------|
| `src/modules/user/user-profile.service.ts` | All profile business logic |
| `src/modules/user/user-profile.controller.ts` | All profile endpoints |
| `src/modules/user/dto/update-profile.dto.ts` | DTO for editing name/phone |
| `src/modules/user/dto/update-email.dto.ts` | DTO for email update (requires password) |
| `src/modules/user/dto/update-phone.dto.ts` | DTO for phone update |
| `src/modules/user/dto/change-password.dto.ts` | DTO for password change |
| `src/modules/user/dto/update-notifications.dto.ts` | DTO for notification preferences |
| `uploads/avatars/` | Avatar file storage directory |

### Modified Files

| File | Changes |
|------|---------|
| `src/modules/user/schemas/user.schema.ts` | Added `avatar_url` and `notification_preferences` fields |
| `src/modules/user/user.service.ts` | Added `getProfile()` with safe projection (excludes sensitive fields) |
| `src/modules/user/user.module.ts` | Registered `UserProfileService` + `UserProfileController` |
| `src/main.ts` | Added `NestExpressApplication` type, static file serving for `/uploads` |

---

## Existing Utils Used

| Util | Used For |
|------|----------|
| `BcryptPasswordHelper` | Verify current password (email update, password change), hash new password |
| `RandomNumberGenerator` | UUID for avatar filenames, email verification tokens |
| `DateHelper` | Token expiry calculation for email re-verification |
| `SMTPEmailer` + `EmailConfig` + `CommonEmailSendEntity` | Sending re-verification email on email change |
| `ErrorEntity` + `HttpStatus` | Consistent error responses |

---

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

All endpoints require `Authorization: Bearer <access_token>`

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | GET | `/user/profile` | View own profile |
| 2 | PATCH | `/user/profile` | Edit profile (first_name, last_name, phone) |
| 3 | PATCH | `/user/email` | Update email (requires password, triggers re-verification) |
| 4 | PATCH | `/user/phone` | Update phone number |
| 5 | PATCH | `/user/password` | Change password (requires current password) |
| 6 | POST | `/user/profile/avatar` | Upload profile image (multipart/form-data) |
| 7 | DELETE | `/user/profile/avatar` | Remove profile image |
| 8 | PATCH | `/user/notifications` | Update notification preferences |

---

## Profile Response (Sensitive Fields Excluded)

When fetching profile, these fields are **excluded** from the response:

- `password_hash`
- `email_verification_token` / `email_verification_expires`
- `password_reset_token` / `password_reset_expires`
- `two_fa_secret`
- `failed_login_attempts` / `locked_until`
- `is_deleted` / `deleted_at`

**Sample profile response:**

```json
{
  "success": true,
  "code": 200,
  "data": {
    "_id": "665a1b2c3d4e5f6789012345",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "avatar_url": "uploads/avatars/550e8400-e29b-41d4-a716-446655440000.jpg",
    "status": "active",
    "is_verified": true,
    "is_2fa_enabled": false,
    "notification_preferences": {
      "email_on_login": false,
      "email_on_password_change": true,
      "email_on_security_alert": true
    },
    "last_login_at": "2024-06-01T10:30:00.000Z",
    "last_login_ip": "192.168.1.1",
    "created_at": "2024-05-15T08:00:00.000Z",
    "updated_at": "2024-06-01T10:30:00.000Z"
  }
}
```

---

## How to Test Every API

### Prerequisites

1. Start the app: `npm run start:dev`
2. Register + verify + login a user (Sprint 1 APIs)
3. Copy the `access_token` from login response
4. Use it as `Authorization: Bearer <access_token>` in all requests below

---

### 1. Get Profile

```bash
curl -X GET http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer <access_token>"
```

**Test cases:**
- Valid token → `200` full profile returned (sensitive fields excluded)
- No token → `401 unauthorized`
- Expired token → `401 unauthorized`

---

### 2. Update Profile

```bash
curl -X PATCH http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+919876543210"
  }'
```

**Test cases:**
- Update all fields → `200` updated profile returned
- Update single field → `200` only that field changes
- Empty body → `200` no changes (all fields optional)
- No token → `401 unauthorized`

---

### 3. Update Email

```bash
curl -X PATCH http://localhost:3000/api/v1/user/email \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "new_email": "newemail@example.com",
    "password": "StrongP@ss1"
  }'
```

**Expected:** `200` — email updated, user status set to `pending`, verification email sent to new address

**Test cases:**
- Valid email + correct password → email changed, re-verification required
- Wrong password → `401 invalid_password`
- Same email as current → `400 same_email`
- Email already taken by another user → `409 email_taken`
- Invalid email format → `400 bad_request` (validation)

**Important:** After updating email, the user **cannot login** until re-verifying. Use the verification token from DB:

```javascript
// Get the new verification token
db.users.findOne({ email: "newemail@example.com" }, { email_verification_token: 1 })
```

Then call `POST /auth/verify-email` with that token.

---

### 4. Update Phone

```bash
curl -X PATCH http://localhost:3000/api/v1/user/phone \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210"
  }'
```

**Test cases:**
- Valid phone → `200` updated profile returned
- Empty phone → `400 bad_request` (validation)
- No token → `401 unauthorized`

---

### 5. Change Password

```bash
curl -X PATCH http://localhost:3000/api/v1/user/password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "StrongP@ss1",
    "new_password": "NewStrongP@ss2"
  }'
```

**Test cases:**
- Correct current password + valid new password → `200` password changed
- Wrong current password → `401 invalid_password`
- Same as current password → `400 same_password`
- New password < 8 chars → `400 bad_request` (validation)
- No token → `401 unauthorized`

**Note:** After changing password, existing access tokens remain valid until they expire. For security, you may want to logout and re-login.

---

### 6. Upload Avatar

```bash
curl -X POST http://localhost:3000/api/v1/user/profile/avatar \
  -H "Authorization: Bearer <access_token>" \
  -F "avatar=@/path/to/image.jpg"
```

**Expected:** `200` — returns `avatar_url` path

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

**Access the avatar at:** `http://localhost:3000/uploads/avatars/<filename>`

**Test cases:**
- Valid image (jpg/png/gif/webp) → `200` uploaded
- Non-image file (pdf, txt) → `400` only image files allowed
- File > 5MB → `400` file too large
- No file attached → `400 no_file`
- Upload again → old avatar file deleted, new one saved
- No token → `401 unauthorized`

---

### 7. Remove Avatar

```bash
curl -X DELETE http://localhost:3000/api/v1/user/profile/avatar \
  -H "Authorization: Bearer <access_token>"
```

**Test cases:**
- User has avatar → `200` file deleted, `avatar_url` cleared
- User has no avatar → `200` no-op (still returns success)
- No token → `401 unauthorized`

---

### 8. Update Notification Preferences

```bash
curl -X PATCH http://localhost:3000/api/v1/user/notifications \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email_on_login": true,
    "email_on_password_change": true,
    "email_on_security_alert": false
  }'
```

**Test cases:**
- Update all preferences → `200` updated preferences returned
- Update single preference → `200` only that one changes, others remain
- Empty body → `200` no changes
- Invalid type (string instead of boolean) → `400 bad_request` (validation)
- No token → `401 unauthorized`

**Default notification preferences for new users:**

```json
{
  "email_on_login": false,
  "email_on_password_change": true,
  "email_on_security_alert": true
}
```

---

## Feature Implementation Details

### Update Email Flow

```
PATCH /user/email (with password confirmation)
    ↓
Email changed → status: "pending" → is_verified: false
    ↓
Verification email sent to NEW email address
    ↓
User clicks verify link → POST /auth/verify-email
    ↓
status: "active" → is_verified: true → can login again
```

**Security:** Password confirmation prevents unauthorized email changes if someone has access to an active session.

### Change Password Flow

```
PATCH /user/password (with current password)
    ↓
Validates current password → checks new ≠ current
    ↓
Hashes new password → updates password_hash + password_changed_at
    ↓
Existing access tokens still work until expiry
(User should logout + re-login for full security)
```

### Avatar Upload

- **Storage:** Local disk at `./uploads/avatars/`
- **Filename:** UUID-based to prevent conflicts (e.g., `550e8400-e29b-41d4-a716-446655440000.jpg`)
- **Max size:** 5MB
- **Allowed types:** jpg, jpeg, png, gif, webp
- **Old file cleanup:** When uploading a new avatar, the old file is automatically deleted from disk
- **Static serving:** Avatars accessible at `http://localhost:3000/uploads/avatars/<filename>`

### Notification Preferences

- Stored as embedded object in User document (no separate collection)
- Partial updates supported (send only the fields you want to change)
- Defaults applied on user creation: login=off, password_change=on, security_alert=on
- These preferences will be used by the notification module in Sprint 7

### Profile Projection

The `getProfile()` method uses MongoDB projection to exclude sensitive fields at the database level, ensuring they never reach the response even if the interceptor fails.

---

## Database Changes

### User Schema — New Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `avatar_url` | `String` | `null` | Path to avatar file |
| `notification_preferences` | `Object` | `{ email_on_login: false, email_on_password_change: true, email_on_security_alert: true }` | User notification settings |

### Useful DB Queries for Testing

```javascript
// View profile data (what the API returns)
db.users.findOne(
  { email: "john@example.com" },
  { password_hash: 0, email_verification_token: 0, password_reset_token: 0, two_fa_secret: 0, failed_login_attempts: 0 }
)

// Check avatar_url
db.users.findOne({ email: "john@example.com" }, { avatar_url: 1 })

// Check notification preferences
db.users.findOne({ email: "john@example.com" }, { notification_preferences: 1 })

// Manually clear avatar
db.users.updateOne(
  { email: "john@example.com" },
  { $unset: { avatar_url: "" } }
)

// Check if email was changed (status should be pending)
db.users.findOne({ email: "newemail@example.com" }, { status: 1, is_verified: 1, email_verification_token: 1 })
```

---

## Full Test Scenario (End to End)

1. **Login** → `POST /auth/login` → get `access_token`
2. **View profile** → `GET /user/profile` → see initial data
3. **Update name** → `PATCH /user/profile` with `{ "first_name": "Jane" }`
4. **Upload avatar** → `POST /user/profile/avatar` with image file
5. **View profile** → verify `avatar_url` is set
6. **Open avatar URL** → `http://localhost:3000/uploads/avatars/<filename>` → see image
7. **Upload new avatar** → old file deleted, new one saved
8. **Remove avatar** → `DELETE /user/profile/avatar` → file deleted, field cleared
9. **Update phone** → `PATCH /user/phone` with `{ "phone": "+91..." }`
10. **Update notifications** → `PATCH /user/notifications` with `{ "email_on_login": true }`
11. **Change password** → `PATCH /user/password` → verify old password required
12. **Try same password** → should get `400 same_password`
13. **Update email** → `PATCH /user/email` → requires password, triggers re-verification
14. **Check DB** → verify status is `pending`, `is_verified` is `false`
15. **Try login** → should fail with `403 email_not_verified`
16. **Get verification token from DB** → `POST /auth/verify-email`
17. **Login again** → success with new email

---

## Sprint 2 Checklist

| # | Feature | Status |
|---|---------|--------|
| 1 | View profile | Done |
| 2 | Edit profile (name, phone) | Done |
| 3 | Update email (with re-verification) | Done |
| 4 | Update phone number | Done |
| 5 | Upload profile image | Done |
| 6 | Remove profile image | Done |
| 7 | Change password | Done |
| 8 | Manage notification preferences | Done |
| 9 | View last login (included in profile) | Done |
| 10 | View account status (included in profile) | Done |
| 11 | Sensitive field exclusion | Done |
| 12 | Static file serving for avatars | Done |
