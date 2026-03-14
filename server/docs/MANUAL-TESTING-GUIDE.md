# Manual Testing Guide — NestJS MongoDB User Management System

> Complete step-by-step guide to manually test all **85+ API endpoints** across **14 modules**.
> Follow the sections **in order** — later sections depend on data created in earlier ones.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Setup](#2-environment-setup)
3. [Variables Reference](#3-variables-reference)
4. [Phase 1 — Health & Public Endpoints](#phase-1--health--public-endpoints)
5. [Phase 2 — Authentication Flow](#phase-2--authentication-flow)
6. [Phase 3 — User Profile Management](#phase-3--user-profile-management)
7. [Phase 4 — Session & Security](#phase-4--session--security)
8. [Phase 5 — Admin User Management](#phase-5--admin-user-management)
9. [Phase 6 — Role & Permission Management](#phase-6--role--permission-management)
10. [Phase 7 — Group Management](#phase-7--group-management)
11. [Phase 8 — System Configuration](#phase-8--system-configuration)
12. [Phase 9 — Invitations](#phase-9--invitations)
13. [Phase 10 — API Keys](#phase-10--api-keys)
14. [Phase 11 — Audit Logs](#phase-11--audit-logs)
15. [Phase 12 — Analytics Dashboard](#phase-12--analytics-dashboard)
16. [Phase 13 — Social Auth Connectors](#phase-13--social-auth-connectors)
17. [Phase 14 — Social Auth Flow](#phase-14--social-auth-flow)
18. [Phase 15 — GDPR & Account Lifecycle](#phase-15--gdpr--account-lifecycle)
19. [Phase 16 — Two-Factor Authentication](#phase-16--two-factor-authentication)
20. [Phase 17 — Admin Impersonation](#phase-17--admin-impersonation)
21. [Troubleshooting](#troubleshooting)
22. [Testing Checklist](#testing-checklist)

---

## 1. Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | >= 20.x | `node -v` |
| MongoDB | >= 6.x | `mongosh --eval "db.version()"` |
| npm / yarn | latest | `npm -v` |
| curl | any | `curl --version` |
| jq (optional) | any | `jq --version` |

**Tools Recommended:**

- **curl** — All examples use curl. Copy-paste ready.
- **Postman / Insomnia** — Import the curl commands if you prefer a GUI.
- **jq** — Pipe curl output through `| jq .` for pretty-printed JSON.
- **MongoDB Compass** — Visual database inspection.

---

## 2. Environment Setup

### 2.1 Clone & Install

```bash
git clone <repo-url>
cd nestjs-mongodb-setup-utils
npm install
```

### 2.2 Create Environment File

Create `.env.development` in the project root:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/user_management_test

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_ACCESS_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=604800

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email (use Ethereal for testing — https://ethereal.email)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-user@ethereal.email
SMTP_PASS=your-ethereal-password
EMAIL_FROM=noreply@example.com
```

### 2.3 Start MongoDB

```bash
# Local MongoDB
mongod

# Or Docker
docker run -d -p 27017:27017 --name mongo-test mongo:7
```

### 2.4 Start the Application

```bash
npm run start:dev
```

**Expected output:**
```
[Nest] LOG [SeedService] Seeded XX permissions (upsert)
[Nest] LOG [SeedService] Seeded 4 roles: super_admin, admin, moderator, user
[Nest] LOG [SystemConfigService] Seeded 19 system configuration defaults
[Nest] LOG [NestApplication] Nest application successfully started
```

### 2.5 Verify Database Seeding

```bash
# Check seeded data in MongoDB
mongosh user_management_test --eval "
  print('Permissions:', db.permissions.countDocuments());
  print('Roles:', db.roles.countDocuments());
  print('System Configs:', db.systemconfigs.countDocuments());
"
```

Expected: ~30+ permissions, 4 roles, 19 system configs.

---

## 3. Variables Reference

Throughout this guide, replace these placeholders with actual values from responses:

| Variable | Description | Where You Get It |
|----------|-------------|------------------|
| `{{BASE}}` | API base URL | `http://localhost:3000` |
| `{{ACCESS_TOKEN}}` | JWT access token | From login response |
| `{{REFRESH_TOKEN}}` | JWT refresh token | From login response |
| `{{ADMIN_TOKEN}}` | Super admin access token | From admin login |
| `{{USER_ID}}` | MongoDB user _id | From register/login response |
| `{{ROLE_ID}}` | MongoDB role _id | From role listing |
| `{{GROUP_ID}}` | MongoDB group _id | From group creation |
| `{{SESSION_ID}}` | Session _id | From session listing |
| `{{INVITATION_ID}}` | Invitation _id | From invitation creation |
| `{{API_KEY_ID}}` | API key _id | From API key creation |
| `{{CONNECTOR_ID}}` | Social connector _id | From connector creation |
| `{{VERIFY_TOKEN}}` | Email verification token | From email or DB |
| `{{RESET_TOKEN}}` | Password reset token | From email or DB |

**Pro Tip:** Set shell variables to avoid copy-pasting:

```bash
BASE="http://localhost:3000"
# After login:
TOKEN="eyJhbG..."
AUTH="Authorization: Bearer $TOKEN"
```

---

## Phase 1 — Health & Public Endpoints

### 1.1 App Health Check

```bash
curl -s http://localhost:3000/ | jq .
```

**Expected:** `200 OK` with a welcome/hello message.

### 1.2 List Social Providers (Public)

```bash
curl -s http://localhost:3000/auth/social/providers | jq .
```

**Expected:** `200 OK` — Empty array `[]` (no connectors configured yet).

---

## Phase 2 — Authentication Flow

This is the most critical phase. Every subsequent phase depends on tokens obtained here.

### 2.1 Register — First User (becomes Super Admin by assignment later)

```bash
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Super",
    "last_name": "Admin",
    "email": "admin@test.com",
    "password": "Admin@123456"
  }' | jq .
```

**Expected:** `201 Created` with user object. Save the `_id` as `{{USER_ID}}`.

### 2.2 Verify Email

The app sends a verification email. For testing, grab the token from the database:

```bash
# Get verification token from DB
mongosh user_management_test --eval "
  db.users.findOne({email:'admin@test.com'}, {verification_token:1})
"
```

```bash
curl -s -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "{{VERIFY_TOKEN}}"
  }' | jq .
```

**Expected:** `200 OK` — Email verified message.

**Alternative — GET method:**

```bash
curl -s "http://localhost:3000/auth/verify-email?token={{VERIFY_TOKEN}}" | jq .
```

### 2.3 Resend Verification (test before verifying, if needed)

```bash
curl -s -X POST http://localhost:3000/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com"
  }' | jq .
```

**Expected:** `200 OK` — Verification email resent.

### 2.4 Login

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123456"
  }' | jq .
```

**Expected:** `200 OK` with:
```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "...",
  "user": { "_id": "...", "email": "admin@test.com", ... }
}
```

**Save these values:**
```bash
TOKEN="<paste access_token here>"
REFRESH="<paste refresh_token here>"
AUTH="Authorization: Bearer $TOKEN"
```

### 2.5 Assign Super Admin Role (via DB — first user bootstrap)

Since there's no admin yet, manually assign the super_admin role:

```bash
mongosh user_management_test --eval "
  const role = db.roles.findOne({slug:'super_admin'});
  const user = db.users.findOne({email:'admin@test.com'});
  db.users.updateOne({_id: user._id}, {\$set: {roles: [role._id]}});
  print('Super admin role assigned to:', user.email);
"
```

**Re-login** to get a token with the updated role:

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123456"
  }' | jq .
```

```bash
ADMIN_TOKEN="<paste new access_token>"
ADMIN_AUTH="Authorization: Bearer $ADMIN_TOKEN"
```

### 2.6 Refresh Token

```bash
curl -s -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "{{REFRESH_TOKEN}}"
  }' | jq .
```

**Expected:** `200 OK` — New access_token and refresh_token pair.

### 2.7 Forgot Password

```bash
curl -s -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com"
  }' | jq .
```

**Expected:** `200 OK` — Reset email sent (check Ethereal inbox or DB for token).

### 2.8 Reset Password

```bash
# Get reset token from DB
mongosh user_management_test --eval "
  db.users.findOne({email:'admin@test.com'}, {reset_password_token:1})
"
```

```bash
curl -s -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "{{RESET_TOKEN}}",
    "new_password": "NewAdmin@123456"
  }' | jq .
```

**Expected:** `200 OK` — Password reset successful. Use new password for subsequent logins.

### 2.9 Register a Regular User (for multi-user testing)

```bash
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@test.com",
    "password": "John@123456"
  }' | jq .
```

Verify email (same process as 2.2), then login:

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "John@123456"
  }' | jq .
```

```bash
USER_TOKEN="<paste access_token>"
USER_AUTH="Authorization: Bearer $USER_TOKEN"
```

### 2.10 Logout

```bash
curl -s -X POST http://localhost:3000/auth/logout \
  -H "$AUTH" | jq .
```

**Expected:** `200 OK` — Session terminated, refresh token invalidated.

### 2.11 Test Auth Error Cases

```bash
# Wrong password
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"wrong"}' | jq .
# Expected: 401 Unauthorized

# Unverified email login (register without verifying)
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Unverified","email":"unverified@test.com","password":"Test@123456"}' | jq .
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"unverified@test.com","password":"Test@123456"}' | jq .
# Expected: 403 or error about email not verified

# Invalid refresh token
curl -s -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"invalid-token"}' | jq .
# Expected: 401 Unauthorized

# No auth token on protected route
curl -s http://localhost:3000/user/profile | jq .
# Expected: 401 Unauthorized
```

---

## Phase 3 — User Profile Management

> Use the regular user token (`$USER_AUTH`) for these tests.

### 3.1 Get Profile

```bash
curl -s http://localhost:3000/user/profile \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — Full user profile object.

### 3.2 Update Profile

```bash
curl -s -X PATCH http://localhost:3000/user/profile \
  -H "$USER_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jonathan",
    "last_name": "Doe",
    "phone": "+1234567890"
  }' | jq .
```

**Expected:** `200 OK` — Updated profile.

### 3.3 Update Email

```bash
curl -s -X PATCH http://localhost:3000/user/email \
  -H "$USER_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "new_email": "jonathan@test.com",
    "password": "John@123456"
  }' | jq .
```

**Expected:** `200 OK` — Email updated (may require re-verification).

### 3.4 Update Phone

```bash
curl -s -X PATCH http://localhost:3000/user/phone \
  -H "$USER_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+9876543210"
  }' | jq .
```

**Expected:** `200 OK` — Phone updated.

### 3.5 Change Password

```bash
curl -s -X PATCH http://localhost:3000/user/password \
  -H "$USER_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "John@123456",
    "new_password": "John@654321"
  }' | jq .
```

**Expected:** `200 OK` — Password changed. Use new password for future logins.

### 3.6 Upload Avatar

```bash
curl -s -X POST http://localhost:3000/user/profile/avatar \
  -H "$USER_AUTH" \
  -F "avatar=@/path/to/test-image.jpg" | jq .
```

**Expected:** `200 OK` — Avatar URL in response.

**Error case — non-image file:**
```bash
curl -s -X POST http://localhost:3000/user/profile/avatar \
  -H "$USER_AUTH" \
  -F "avatar=@/path/to/document.pdf" | jq .
# Expected: 400 Bad Request — only images allowed
```

### 3.7 Remove Avatar

```bash
curl -s -X DELETE http://localhost:3000/user/profile/avatar \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — Avatar removed.

### 3.8 Update Notification Preferences

```bash
curl -s -X PATCH http://localhost:3000/user/notifications \
  -H "$USER_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "email_on_login": true,
    "email_on_password_change": true,
    "email_on_security_alert": false
  }' | jq .
```

**Expected:** `200 OK` — Notification preferences updated.

---

## Phase 4 — Session & Security

### 4.1 Get Active Sessions

```bash
curl -s http://localhost:3000/sessions \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — Array of active sessions with IP, user-agent, created_at.

### 4.2 Get Login History

```bash
curl -s "http://localhost:3000/security/login-history?page=1&limit=10" \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — Paginated login history.

### 4.3 Get Security Events

```bash
curl -s "http://localhost:3000/security/events?page=1&limit=10" \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — Security events (password changes, 2FA, etc.).

### 4.4 Terminate a Specific Session

First get sessions to find a session ID:
```bash
curl -s http://localhost:3000/sessions -H "$USER_AUTH" | jq '.[0]._id'
```

```bash
curl -s -X DELETE http://localhost:3000/sessions/{{SESSION_ID}} \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — Session terminated.

### 4.5 Terminate All Other Sessions

```bash
curl -s -X DELETE http://localhost:3000/sessions \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — All other sessions terminated (current session kept).

---

## Phase 5 — Admin User Management

> Use the admin token (`$ADMIN_AUTH`) for all admin endpoints.

### 5.1 List Users (Paginated)

```bash
curl -s "http://localhost:3000/admin/users?page=1&limit=10" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Paginated users list with metadata.

### 5.2 Search Users

```bash
curl -s "http://localhost:3000/admin/users?search=john&page=1&limit=10" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Filtered results matching "john".

### 5.3 Get Single User

```bash
curl -s http://localhost:3000/admin/users/{{USER_ID}} \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Full user details with populated roles.

### 5.4 Create User (Admin)

```bash
curl -s -X POST http://localhost:3000/admin/users \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@test.com",
    "password": "Jane@123456",
    "status": "active",
    "is_verified": true
  }' | jq .
```

**Expected:** `201 Created` — New user created (pre-verified by admin).

### 5.5 Update User (Admin)

```bash
curl -s -X PATCH http://localhost:3000/admin/users/{{USER_ID}} \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane Updated",
    "phone": "+1112223333"
  }' | jq .
```

**Expected:** `200 OK` — User updated.

### 5.6 Update User Status

```bash
curl -s -X PATCH http://localhost:3000/admin/users/{{USER_ID}}/status \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }' | jq .
```

**Expected:** `200 OK` — Status changed to inactive.

### 5.7 Suspend User

```bash
curl -s -X PATCH http://localhost:3000/admin/users/{{USER_ID}}/suspend \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — User suspended.

### 5.8 Reset User Password (Admin)

```bash
curl -s -X POST http://localhost:3000/admin/users/{{USER_ID}}/reset-password \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "new_password": "ResetByAdmin@123"
  }' | jq .
```

**Expected:** `200 OK` — Password reset by admin.

### 5.9 Assign Roles to User

First get role IDs:
```bash
mongosh user_management_test --eval "db.roles.find({},{name:1,_id:1}).forEach(printjson)"
```

```bash
curl -s -X POST http://localhost:3000/admin/users/{{USER_ID}}/roles \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": ["{{ROLE_ID}}"]
  }' | jq .
```

**Expected:** `200 OK` — Roles assigned.

### 5.10 Remove Roles from User

```bash
curl -s -X DELETE http://localhost:3000/admin/users/{{USER_ID}}/roles \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": ["{{ROLE_ID}}"]
  }' | jq .
```

**Expected:** `200 OK` — Roles removed.

### 5.11 Export Users

```bash
curl -s "http://localhost:3000/admin/users/export?page=1&limit=100" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Users export data.

### 5.12 Soft Delete User

```bash
curl -s -X DELETE http://localhost:3000/admin/users/{{USER_ID}}/soft \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — User soft-deleted (is_deleted = true).

### 5.13 Restore User

```bash
curl -s -X PATCH http://localhost:3000/admin/users/{{USER_ID}}/restore \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — User restored.

### 5.14 Hard Delete User

> **Warning:** This permanently removes the user from the database.

```bash
curl -s -X DELETE http://localhost:3000/admin/users/{{USER_ID}} \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — User permanently deleted.

### 5.15 Test Permission Denial

```bash
# Regular user trying admin endpoint
curl -s "http://localhost:3000/admin/users?page=1&limit=10" \
  -H "$USER_AUTH" | jq .
# Expected: 403 Forbidden
```

---

## Phase 6 — Role & Permission Management

> Roles and permissions are seeded automatically. Test reading them.

### 6.1 List Permissions (via DB)

Permissions are managed internally by the seed service. Verify via database:

```bash
mongosh user_management_test --eval "
  db.permissions.find({},{slug:1,name:1,module:1,action:1}).sort({module:1}).forEach(printjson)
"
```

**Expected:** 30+ permissions across modules: user, role, permission, session, audit, analytics, group, settings, invitation, connector.

### 6.2 List Roles (via DB)

```bash
mongosh user_management_test --eval "
  db.roles.find({},{name:1,slug:1,description:1,is_system:1,is_default:1}).forEach(printjson)
"
```

**Expected:**
| Role | Slug | System | Default |
|------|------|--------|---------|
| Super Admin | super_admin | true | false |
| Admin | admin | true | false |
| Moderator | moderator | false | false |
| User | user | false | true |

---

## Phase 7 — Group Management

### 7.1 Create Group

```bash
curl -s -X POST http://localhost:3000/admin/groups \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Team",
    "slug": "engineering",
    "description": "All engineers"
  }' | jq .
```

**Expected:** `201 Created`. Save `_id` as `{{GROUP_ID}}`.

### 7.2 List Groups

```bash
curl -s "http://localhost:3000/admin/groups?page=1&limit=10" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Paginated groups list.

### 7.3 Search Groups

```bash
curl -s "http://localhost:3000/admin/groups?search=engineering" \
  -H "$ADMIN_AUTH" | jq .
```

### 7.4 Get Single Group

```bash
curl -s http://localhost:3000/admin/groups/{{GROUP_ID}} \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Group with populated roles and users.

### 7.5 Update Group

```bash
curl -s -X PATCH http://localhost:3000/admin/groups/{{GROUP_ID}} \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "All engineering team members"
  }' | jq .
```

### 7.6 Add Users to Group

```bash
curl -s -X POST http://localhost:3000/admin/groups/{{GROUP_ID}}/users \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["{{USER_ID}}"]
  }' | jq .
```

**Expected:** `200 OK` — Users added to group.

### 7.7 Remove Users from Group

```bash
curl -s -X DELETE http://localhost:3000/admin/groups/{{GROUP_ID}}/users \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["{{USER_ID}}"]
  }' | jq .
```

### 7.8 Assign Roles to Group

```bash
curl -s -X POST http://localhost:3000/admin/groups/{{GROUP_ID}}/roles \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": ["{{ROLE_ID}}"]
  }' | jq .
```

**Expected:** `200 OK` — Roles assigned to group.

### 7.9 Remove Roles from Group

```bash
curl -s -X DELETE http://localhost:3000/admin/groups/{{GROUP_ID}}/roles \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": ["{{ROLE_ID}}"]
  }' | jq .
```

### 7.10 Get Resolved Group Permissions

```bash
curl -s http://localhost:3000/admin/groups/{{GROUP_ID}}/permissions \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — All permissions derived from the group's assigned roles.

### 7.11 Delete Group

```bash
curl -s -X DELETE http://localhost:3000/admin/groups/{{GROUP_ID}} \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Group deleted.

---

## Phase 8 — System Configuration

### 8.1 Get All Settings

```bash
curl -s http://localhost:3000/admin/settings \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — 19 auto-seeded config entries across 4 categories (app, auth, email, security).

### 8.2 Get Settings by Category

```bash
curl -s http://localhost:3000/admin/settings/category/app \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Only `app.*` configs.

```bash
# Test all categories
curl -s http://localhost:3000/admin/settings/category/auth -H "$ADMIN_AUTH" | jq .
curl -s http://localhost:3000/admin/settings/category/email -H "$ADMIN_AUTH" | jq .
curl -s http://localhost:3000/admin/settings/category/security -H "$ADMIN_AUTH" | jq .
```

### 8.3 Get Setting by Key

```bash
curl -s http://localhost:3000/admin/settings/key/app.site_name \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Single config with value "NestJS App".

### 8.4 Update Setting

```bash
curl -s -X PATCH http://localhost:3000/admin/settings/key/app.site_name \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "My Awesome App"
  }' | jq .
```

**Expected:** `200 OK` — Value updated.

### 8.5 Bulk Update by Category

```bash
curl -s -X PATCH http://localhost:3000/admin/settings/category/app \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "app.site_name": "Updated App Name",
    "app.support_email": "help@updated.com"
  }' | jq .
```

**Expected:** `200 OK` — Multiple configs updated.

### 8.6 Create Custom Setting

```bash
curl -s -X POST http://localhost:3000/admin/settings \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "custom.feature_flag",
    "value": true,
    "category": "custom",
    "description": "Enable experimental feature"
  }' | jq .
```

**Expected:** `201 Created`.

### 8.7 Delete Setting

```bash
curl -s -X DELETE http://localhost:3000/admin/settings/key/custom.feature_flag \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Config deleted.

---

## Phase 9 — Invitations

### 9.1 Create Invitation

```bash
curl -s -X POST http://localhost:3000/admin/invitations \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com"
  }' | jq .
```

**Expected:** `201 Created` — Invitation with token, expires_at. Save `_id` as `{{INVITATION_ID}}`.

### 9.2 Create Invitation with Role

```bash
# Get a role ID first
mongosh user_management_test --eval "db.roles.findOne({slug:'moderator'},{_id:1})"
```

```bash
curl -s -X POST http://localhost:3000/admin/invitations \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "moderator@test.com",
    "role_id": "{{ROLE_ID}}"
  }' | jq .
```

### 9.3 List Invitations

```bash
curl -s "http://localhost:3000/admin/invitations?page=1&limit=10" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — All invitations.

### 9.4 Filter by Status

```bash
curl -s "http://localhost:3000/admin/invitations?status=pending" \
  -H "$ADMIN_AUTH" | jq .

curl -s "http://localhost:3000/admin/invitations?status=accepted" \
  -H "$ADMIN_AUTH" | jq .

curl -s "http://localhost:3000/admin/invitations?status=expired" \
  -H "$ADMIN_AUTH" | jq .
```

### 9.5 Get Single Invitation

```bash
curl -s http://localhost:3000/admin/invitations/{{INVITATION_ID}} \
  -H "$ADMIN_AUTH" | jq .
```

### 9.6 Validate Invitation Token (Public)

Get the token from DB:
```bash
mongosh user_management_test --eval "
  db.invitations.findOne({email:'newuser@test.com'},{token:1})
"
```

```bash
curl -s http://localhost:3000/invitations/validate/{{INVITATION_TOKEN}} | jq .
```

**Expected:** `200 OK` — Valid invitation details (email, role, expires_at).

### 9.7 Resend Invitation

```bash
curl -s -X POST http://localhost:3000/admin/invitations/{{INVITATION_ID}}/resend \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Invitation resent, expiry extended.

### 9.8 Revoke Invitation

```bash
curl -s -X DELETE http://localhost:3000/admin/invitations/{{INVITATION_ID}} \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Invitation revoked.

### 9.9 Test Error Cases

```bash
# Invite existing user
curl -s -X POST http://localhost:3000/admin/invitations \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com"}' | jq .
# Expected: 409 Conflict — user already exists

# Validate invalid token
curl -s http://localhost:3000/invitations/validate/invalid-token-here | jq .
# Expected: 404 Not Found or 400 Bad Request
```

---

## Phase 10 — API Keys

### 10.1 Create API Key

```bash
curl -s -X POST http://localhost:3000/user/api-keys \
  -H "$USER_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My CLI Tool"
  }' | jq .
```

**Expected:** `201 Created` — Response includes the **raw API key** (shown only once!). Save it:
```json
{
  "key": "a1b2c3d4...full64chars...",
  "_id": "...",
  "name": "My CLI Tool",
  "prefix": "a1b2c3d4"
}
```

```bash
API_KEY="<paste the raw key>"
API_KEY_ID="<paste the _id>"
```

### 10.2 Create API Key with Permissions & Expiry

```bash
curl -s -X POST http://localhost:3000/user/api-keys \
  -H "$USER_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Read-Only Key",
    "permissions": ["user:read", "session:read"],
    "expires_at": "2027-12-31T23:59:59Z"
  }' | jq .
```

### 10.3 List API Keys

```bash
curl -s http://localhost:3000/user/api-keys \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — List of API keys (key_hash NOT exposed, only prefix shown).

### 10.4 Get Single API Key

```bash
curl -s http://localhost:3000/user/api-keys/{{API_KEY_ID}} \
  -H "$USER_AUTH" | jq .
```

### 10.5 Revoke API Key

```bash
curl -s -X POST http://localhost:3000/user/api-keys/{{API_KEY_ID}}/revoke \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — API key deactivated (is_active = false).

### 10.6 Delete API Key

```bash
curl -s -X DELETE http://localhost:3000/user/api-keys/{{API_KEY_ID}} \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — API key permanently deleted.

---

## Phase 11 — Audit Logs

> Perform these tests **after** completing other phases so there's data to query.

### 11.1 List Audit Logs

```bash
curl -s "http://localhost:3000/admin/audit-logs?page=1&limit=20" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Paginated audit logs with user_id, action, target_type, method, path, status_code, ip, timestamp.

### 11.2 Filter by Action

```bash
curl -s "http://localhost:3000/admin/audit-logs?action=POST&page=1&limit=10" \
  -H "$ADMIN_AUTH" | jq .
```

### 11.3 Filter by User

```bash
curl -s "http://localhost:3000/admin/audit-logs?user_id={{USER_ID}}&page=1&limit=10" \
  -H "$ADMIN_AUTH" | jq .
```

### 11.4 Filter by Date Range

```bash
curl -s "http://localhost:3000/admin/audit-logs?date_from=2026-01-01&date_to=2026-12-31" \
  -H "$ADMIN_AUTH" | jq .
```

### 11.5 Filter by Method

```bash
curl -s "http://localhost:3000/admin/audit-logs?method=DELETE" \
  -H "$ADMIN_AUTH" | jq .
```

### 11.6 Get Action Summary

```bash
curl -s "http://localhost:3000/admin/audit-logs/summary" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Aggregated counts by action type.

### 11.7 Get Single Audit Log

```bash
# Get an audit log ID from the list
curl -s "http://localhost:3000/admin/audit-logs?page=1&limit=1" \
  -H "$ADMIN_AUTH" | jq '.[0]._id'
```

```bash
curl -s http://localhost:3000/admin/audit-logs/{{AUDIT_LOG_ID}} \
  -H "$ADMIN_AUTH" | jq .
```

### 11.8 Export Audit Logs — JSON

```bash
curl -s "http://localhost:3000/admin/audit-logs/export/json" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Full JSON export.

### 11.9 Export Audit Logs — CSV

```bash
curl -s "http://localhost:3000/admin/audit-logs/export/csv" \
  -H "$ADMIN_AUTH"
```

**Expected:** `200 OK` — CSV formatted output with headers.

---

## Phase 12 — Analytics Dashboard

### 12.1 Dashboard Overview

```bash
curl -s http://localhost:3000/admin/analytics/overview \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Aggregated stats (total users, active users, etc.).

### 12.2 Total Users

```bash
curl -s http://localhost:3000/admin/analytics/users/total \
  -H "$ADMIN_AUTH" | jq .
```

### 12.3 Active Users

```bash
curl -s http://localhost:3000/admin/analytics/users/active \
  -H "$ADMIN_AUTH" | jq .
```

### 12.4 Users by Status

```bash
curl -s http://localhost:3000/admin/analytics/users/status \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Breakdown by active, inactive, suspended, etc.

### 12.5 User Growth Over Time

```bash
# Default period
curl -s http://localhost:3000/admin/analytics/users/growth \
  -H "$ADMIN_AUTH" | jq .

# Custom period
curl -s "http://localhost:3000/admin/analytics/users/growth?period=day&days=30" \
  -H "$ADMIN_AUTH" | jq .

curl -s "http://localhost:3000/admin/analytics/users/growth?period=week&days=90" \
  -H "$ADMIN_AUTH" | jq .

curl -s "http://localhost:3000/admin/analytics/users/growth?period=month&days=365" \
  -H "$ADMIN_AUTH" | jq .
```

### 12.6 User Chart Data

```bash
curl -s "http://localhost:3000/admin/analytics/users/chart?days=30" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Time-series data for charts.

### 12.7 Login Activity

```bash
curl -s "http://localhost:3000/admin/analytics/logins?days=30" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Login activity aggregation.

### 12.8 Role Distribution

```bash
curl -s http://localhost:3000/admin/analytics/roles \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — How many users per role.

---

## Phase 13 — Social Auth Connectors

> Admin manages OAuth providers. These are stored in DB and can be enabled/disabled at runtime.

### 13.1 Create Google Connector

```bash
curl -s -X POST http://localhost:3000/admin/social-connectors \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "display_name": "Google",
    "client_id": "your-google-client-id.apps.googleusercontent.com",
    "client_secret": "your-google-client-secret",
    "is_enabled": true
  }' | jq .
```

**Expected:** `201 Created` — Connector created. Note: `client_secret` is masked in response. Save `_id` as `{{CONNECTOR_ID}}`.

### 13.2 Create GitHub Connector

```bash
curl -s -X POST http://localhost:3000/admin/social-connectors \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "github",
    "display_name": "GitHub",
    "client_id": "your-github-client-id",
    "client_secret": "your-github-client-secret",
    "is_enabled": true
  }' | jq .
```

### 13.3 Create Facebook Connector (disabled)

```bash
curl -s -X POST http://localhost:3000/admin/social-connectors \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "facebook",
    "display_name": "Facebook",
    "client_id": "your-facebook-app-id",
    "client_secret": "your-facebook-app-secret",
    "is_enabled": false
  }' | jq .
```

### 13.4 List All Connectors

```bash
curl -s http://localhost:3000/admin/social-connectors \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — All connectors (client_secret masked).

### 13.5 Get Single Connector

```bash
curl -s http://localhost:3000/admin/social-connectors/{{CONNECTOR_ID}} \
  -H "$ADMIN_AUTH" | jq .
```

### 13.6 Update Connector

```bash
curl -s -X PATCH http://localhost:3000/admin/social-connectors/{{CONNECTOR_ID}} \
  -H "$ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Sign in with Google",
    "scopes": ["email", "profile", "openid"]
  }' | jq .
```

### 13.7 Toggle Connector (Enable/Disable)

```bash
curl -s -X PATCH http://localhost:3000/admin/social-connectors/{{CONNECTOR_ID}}/toggle \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — `is_enabled` flipped.

### 13.8 Delete Connector

```bash
curl -s -X DELETE http://localhost:3000/admin/social-connectors/{{CONNECTOR_ID}} \
  -H "$ADMIN_AUTH" | jq .
```

### 13.9 Verify Public Provider List Updated

```bash
curl -s http://localhost:3000/auth/social/providers | jq .
```

**Expected:** Only `is_enabled: true` connectors shown (sanitized, no secrets).

---

## Phase 14 — Social Auth Flow

> These endpoints initiate OAuth redirects. Full testing requires real OAuth credentials.
> For manual testing without real providers, you can test the redirect behavior and error handling.

### 14.1 Initiate OAuth Redirect

Open in browser (not curl — it's a redirect):
```
http://localhost:3000/auth/social/google?state=test123
```

**Expected:** `302 Redirect` to Google's OAuth consent screen.

With curl (follow redirects to see the URL):
```bash
curl -s -v "http://localhost:3000/auth/social/google?state=test123" 2>&1 | grep "Location:"
```

### 14.2 OAuth Callback — Error Handling

```bash
# Simulate error from provider
curl -s "http://localhost:3000/auth/social/google/callback?error=access_denied" -v 2>&1 | grep "Location:"
```

**Expected:** Redirect to `{{FRONTEND_URL}}/login?error=access_denied`.

```bash
# No code parameter
curl -s "http://localhost:3000/auth/social/google/callback" -v 2>&1 | grep "Location:"
```

**Expected:** Redirect to `{{FRONTEND_URL}}/login?error=no_code`.

### 14.3 Invalid Provider

```bash
curl -s "http://localhost:3000/auth/social/invalid_provider" | jq .
```

**Expected:** `404 Not Found` or error about unknown provider.

### 14.4 Link Social Account (Authenticated)

Open in browser while logged in:
```
http://localhost:3000/auth/social/google/link
```

### 14.5 Get Linked Accounts

```bash
curl -s http://localhost:3000/auth/social/accounts/linked \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — Array of linked social accounts (empty if none linked).

### 14.6 Unlink Social Account

```bash
curl -s -X DELETE http://localhost:3000/auth/social/google/unlink \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — Account unlinked (or error if not linked).

---

## Phase 15 — GDPR & Account Lifecycle

### 15.1 Export User Data (GDPR)

```bash
curl -s http://localhost:3000/user/data-export \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — Complete user data export (profile, sessions, etc.).

### 15.2 Delete Account (GDPR)

> **Warning:** This soft-deletes the account with PII anonymization.

```bash
curl -s -X DELETE http://localhost:3000/user/account \
  -H "$USER_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "John@654321"
  }' | jq .
```

**Expected:** `200 OK` — Account soft-deleted, PII anonymized.

**Verify in DB:**
```bash
mongosh user_management_test --eval "
  db.users.findOne({email:'jonathan@test.com'})
"
# Should show: first_name = 'Deleted', last_name = 'User', is_deleted = true
```

### 15.3 Account Recovery — Request

```bash
curl -s -X POST http://localhost:3000/auth/recover-account \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jonathan@test.com"
  }' | jq .
```

**Expected:** `200 OK` — Recovery email sent (if account exists and is deleted).

### 15.4 Account Recovery — Confirm

Get recovery token from DB:
```bash
mongosh user_management_test --eval "
  db.users.findOne({email:'jonathan@test.com'},{reset_password_token:1})
"
```

```bash
curl -s -X POST http://localhost:3000/auth/recover-account/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "token": "{{RECOVERY_TOKEN}}"
  }' | jq .
```

**Expected:** `200 OK` — Account restored (is_deleted = false).

---

## Phase 16 — Two-Factor Authentication

### 16.1 Enable 2FA

```bash
curl -s -X POST http://localhost:3000/auth/2fa/enable \
  -H "$USER_AUTH" | jq .
```

**Expected:** `200 OK` — Returns:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "otpauth://totp/..."
}
```

Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.) or use the secret to generate TOTP codes.

### 16.2 Verify 2FA (Activate)

Generate a 6-digit TOTP code from your authenticator app:

```bash
curl -s -X POST http://localhost:3000/auth/2fa/verify \
  -H "$USER_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }' | jq .
```

**Expected:** `200 OK` — 2FA now active on the account.

### 16.3 Login with 2FA

After 2FA is enabled, login requires the TOTP code. The login flow may return a partial response requiring 2FA verification.

### 16.4 Disable 2FA

```bash
curl -s -X POST http://localhost:3000/auth/2fa/disable \
  -H "$USER_AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "654321"
  }' | jq .
```

**Expected:** `200 OK` — 2FA disabled. Provide a valid current TOTP code.

---

## Phase 17 — Admin Impersonation

> Super Admin can generate tokens on behalf of other users for debugging.

### 17.1 Impersonate User

```bash
curl -s -X POST http://localhost:3000/auth/impersonate/{{USER_ID}} \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** `200 OK` — Returns an access_token that acts as the target user. Token has `impersonated_by` field and 1-hour expiry.

### 17.2 Verify Impersonation

Use the impersonation token to access user endpoints:

```bash
IMPERSONATE_TOKEN="<paste impersonation access_token>"
curl -s http://localhost:3000/user/profile \
  -H "Authorization: Bearer $IMPERSONATE_TOKEN" | jq .
```

**Expected:** `200 OK` — Returns the impersonated user's profile.

### 17.3 Check Audit Trail

```bash
curl -s "http://localhost:3000/admin/audit-logs?action=POST&page=1&limit=5" \
  -H "$ADMIN_AUTH" | jq .
```

**Expected:** Impersonation action logged in audit trail.

---

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` on all endpoints | Token expired or invalid | Re-login to get fresh tokens |
| `403 Forbidden` | Missing required permissions | Check user roles, ensure correct role assignment |
| `Cannot connect to MongoDB` | MongoDB not running | Start MongoDB: `mongod` or `docker start mongo-test` |
| `ECONNREFUSED :3000` | App not running | Run `npm run start:dev` |
| `429 Too Many Requests` | Rate limiting (10 req/min) | Wait 60 seconds or increase ThrottlerModule limit |
| Email not sent | SMTP not configured | Check `.env.development` SMTP settings |
| Seeding didn't run | Module not loaded | Check `SeedModule` in `app.module.ts` imports |
| `E11000 duplicate key` | Unique constraint violation | Check if entity already exists |

### Useful Debug Commands

```bash
# Check MongoDB collections
mongosh user_management_test --eval "db.getCollectionNames()"

# Count documents per collection
mongosh user_management_test --eval "
  db.getCollectionNames().forEach(c =>
    print(c + ': ' + db[c].countDocuments())
  )
"

# View all users
mongosh user_management_test --eval "
  db.users.find({},{email:1,roles:1,is_deleted:1,is_verified:1,status:1}).forEach(printjson)
"

# View all roles with permissions
mongosh user_management_test --eval "
  db.roles.find().forEach(r => {
    print(r.name + ' (' + r.slug + '): ' + r.permissions.length + ' permissions');
  })
"

# Clear all test data (CAUTION)
mongosh user_management_test --eval "db.dropDatabase()"
```

### Rate Limiting

The app has a global rate limiter: **10 requests per 60 seconds**. If you hit it during testing:

```bash
# Check current throttle config
# ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])
```

For faster testing, temporarily increase the limit in `app.module.ts`:
```typescript
ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }])
```

---

## Testing Checklist

Use this checklist to track your testing progress:

### Authentication (15 endpoints)
- [ ] `POST /auth/register` — Register new user
- [ ] `POST /auth/verify-email` — Verify email with token
- [ ] `GET  /auth/verify-email` — Verify email via query param
- [ ] `POST /auth/resend-verification` — Resend verification email
- [ ] `POST /auth/login` — Login with credentials
- [ ] `POST /auth/refresh` — Refresh access token
- [ ] `POST /auth/logout` — Logout and invalidate session
- [ ] `POST /auth/forgot-password` — Request password reset
- [ ] `POST /auth/reset-password` — Reset password with token
- [ ] `POST /auth/recover-account` — Request deleted account recovery
- [ ] `POST /auth/recover-account/confirm` — Confirm account recovery
- [ ] `POST /auth/impersonate/:id` — Admin impersonation
- [ ] `POST /auth/2fa/enable` — Enable two-factor auth
- [ ] `POST /auth/2fa/verify` — Verify/activate 2FA
- [ ] `POST /auth/2fa/disable` — Disable 2FA

### User Profile (10 endpoints)
- [ ] `GET    /user/profile` — Get own profile
- [ ] `PATCH  /user/profile` — Update profile
- [ ] `PATCH  /user/email` — Change email
- [ ] `PATCH  /user/phone` — Change phone
- [ ] `PATCH  /user/password` — Change password
- [ ] `POST   /user/profile/avatar` — Upload avatar
- [ ] `DELETE /user/profile/avatar` — Remove avatar
- [ ] `PATCH  /user/notifications` — Update notification prefs
- [ ] `GET    /user/data-export` — GDPR data export
- [ ] `DELETE /user/account` — GDPR delete account

### Admin Users (13 endpoints)
- [ ] `GET    /admin/users` — List users (paginated)
- [ ] `GET    /admin/users/export` — Export users
- [ ] `GET    /admin/users/:id` — Get single user
- [ ] `POST   /admin/users` — Create user
- [ ] `PATCH  /admin/users/:id` — Update user
- [ ] `PATCH  /admin/users/:id/status` — Update status
- [ ] `PATCH  /admin/users/:id/suspend` — Suspend user
- [ ] `POST   /admin/users/:id/reset-password` — Reset password
- [ ] `POST   /admin/users/:id/roles` — Assign roles
- [ ] `DELETE /admin/users/:id/roles` — Remove roles
- [ ] `DELETE /admin/users/:id/soft` — Soft delete
- [ ] `PATCH  /admin/users/:id/restore` — Restore user
- [ ] `DELETE /admin/users/:id` — Hard delete

### Sessions & Security (5 endpoints)
- [ ] `GET    /sessions` — List active sessions
- [ ] `DELETE /sessions/:id` — Terminate session
- [ ] `DELETE /sessions` — Terminate all sessions
- [ ] `GET    /security/login-history` — Login history
- [ ] `GET    /security/events` — Security events

### Groups (10 endpoints)
- [ ] `POST   /admin/groups` — Create group
- [ ] `GET    /admin/groups` — List groups
- [ ] `GET    /admin/groups/:id` — Get group
- [ ] `PATCH  /admin/groups/:id` — Update group
- [ ] `DELETE /admin/groups/:id` — Delete group
- [ ] `POST   /admin/groups/:id/users` — Add users
- [ ] `DELETE /admin/groups/:id/users` — Remove users
- [ ] `POST   /admin/groups/:id/roles` — Assign roles
- [ ] `DELETE /admin/groups/:id/roles` — Remove roles
- [ ] `GET    /admin/groups/:id/permissions` — Resolved perms

### System Config (7 endpoints)
- [ ] `GET    /admin/settings` — List all settings
- [ ] `GET    /admin/settings/category/:cat` — By category
- [ ] `GET    /admin/settings/key/:key` — By key
- [ ] `POST   /admin/settings` — Create setting
- [ ] `PATCH  /admin/settings/key/:key` — Update setting
- [ ] `PATCH  /admin/settings/category/:cat` — Bulk update
- [ ] `DELETE /admin/settings/key/:key` — Delete setting

### Invitations (6 endpoints)
- [ ] `POST   /admin/invitations` — Create invitation
- [ ] `GET    /admin/invitations` — List invitations
- [ ] `GET    /admin/invitations/:id` — Get invitation
- [ ] `POST   /admin/invitations/:id/resend` — Resend
- [ ] `DELETE /admin/invitations/:id` — Revoke
- [ ] `GET    /invitations/validate/:token` — Validate (public)

### API Keys (5 endpoints)
- [ ] `POST   /user/api-keys` — Create API key
- [ ] `GET    /user/api-keys` — List API keys
- [ ] `GET    /user/api-keys/:id` — Get API key
- [ ] `POST   /user/api-keys/:id/revoke` — Revoke
- [ ] `DELETE /user/api-keys/:id` — Delete

### Audit Logs (5 endpoints)
- [ ] `GET /admin/audit-logs` — List with filters
- [ ] `GET /admin/audit-logs/summary` — Action summary
- [ ] `GET /admin/audit-logs/:id` — Single log
- [ ] `GET /admin/audit-logs/export/json` — JSON export
- [ ] `GET /admin/audit-logs/export/csv` — CSV export

### Analytics (8 endpoints)
- [ ] `GET /admin/analytics/overview` — Dashboard overview
- [ ] `GET /admin/analytics/users/total` — Total users
- [ ] `GET /admin/analytics/users/active` — Active users
- [ ] `GET /admin/analytics/users/status` — By status
- [ ] `GET /admin/analytics/users/growth` — Growth over time
- [ ] `GET /admin/analytics/users/chart` — Chart data
- [ ] `GET /admin/analytics/logins` — Login activity
- [ ] `GET /admin/analytics/roles` — Role distribution

### Social Connectors — Admin (6 endpoints)
- [ ] `POST   /admin/social-connectors` — Create connector
- [ ] `GET    /admin/social-connectors` — List connectors
- [ ] `GET    /admin/social-connectors/:id` — Get connector
- [ ] `PATCH  /admin/social-connectors/:id` — Update connector
- [ ] `PATCH  /admin/social-connectors/:id/toggle` — Toggle
- [ ] `DELETE /admin/social-connectors/:id` — Delete connector

### Social Auth (7 endpoints)
- [ ] `GET    /auth/social/providers` — List enabled (public)
- [ ] `GET    /auth/social/:provider` — OAuth redirect
- [ ] `GET    /auth/social/:provider/callback` — OAuth callback
- [ ] `GET    /auth/social/:provider/link` — Link redirect
- [ ] `GET    /auth/social/:provider/link/callback` — Link callback
- [ ] `GET    /auth/social/accounts/linked` — Linked accounts
- [ ] `DELETE /auth/social/:provider/unlink` — Unlink

### Health (1 endpoint)
- [ ] `GET /` — Health check

---

**Total: 98 test cases across 14 modules**

> Happy Testing!
