# Sprint 4 — RBAC Enforcement & Admin User Management (Complete)

## Summary

Sprint 4 combines two sprint plan items:
- **Sprint Plan Sprint 4:** Apply RBAC guards (`@Roles`, `@Permissions`) to all existing endpoints
- **Sprint Plan Sprint 5:** Full admin user management module with pagination, search, filters, user lifecycle (create, update, delete, suspend, restore), role assignment, and export

---

## Files Created / Modified

### New — Admin Module (10 files)

| File | Purpose |
|------|---------|
| `src/modules/admin/admin.module.ts` | Admin module registration |
| `src/modules/admin/admin-user.service.ts` | Admin user management business logic |
| `src/modules/admin/admin-user.controller.ts` | 13 admin REST endpoints |
| `src/modules/admin/dto/list-users-query.dto.ts` | Pagination, search, filter query DTO |
| `src/modules/admin/dto/admin-create-user.dto.ts` | Admin create user DTO |
| `src/modules/admin/dto/admin-update-user.dto.ts` | Admin update user DTO |
| `src/modules/admin/dto/admin-update-status.dto.ts` | Status change DTO |
| `src/modules/admin/dto/admin-reset-password.dto.ts` | Admin password reset DTO |
| `src/modules/admin/dto/admin-assign-roles.dto.ts` | Role assignment DTO |

### Modified — RBAC Applied to Existing Endpoints

| File | Changes |
|------|---------|
| `src/modules/user/user-profile.controller.ts` | Added `@Permissions('user:read')` to GET profile, `@Permissions('user:update')` to all update/upload/delete endpoints |
| `src/app.module.ts` | Imported `AdminModule` |

---

## Existing Utils Used

| Util | Used For |
|------|----------|
| `BcryptPasswordHelper` | Password hashing (admin create user, admin reset password) |
| `ErrorEntity` + `HttpStatus` | All error responses |
| `ResultEntity` | All success responses via global interceptor |

---

## RBAC Coverage — All Endpoints

### Auth Endpoints (No Permission Required — Public)

| Endpoint | Decorator | Reason |
|----------|-----------|--------|
| `POST /auth/register` | `@Public()` | Open registration |
| `POST /auth/verify-email` | `@Public()` | Email verification |
| `GET /auth/verify-email` | `@Public()` | Browser email verification link |
| `POST /auth/resend-verification` | `@Public()` | Re-send verification |
| `POST /auth/login` | `@Public()` | Login |
| `POST /auth/refresh` | `@Public()` | Token refresh |
| `POST /auth/forgot-password` | `@Public()` | Password reset request |
| `POST /auth/reset-password` | `@Public()` | Password reset |

### Auth Endpoints (JWT Required, No Permission)

| Endpoint | Decorator | Reason |
|----------|-----------|--------|
| `POST /auth/logout` | `@ApiBearerAuth` | Any authenticated user can logout |
| `POST /auth/2fa/enable` | `@ApiBearerAuth` | Any authenticated user can manage their 2FA |
| `POST /auth/2fa/verify` | `@ApiBearerAuth` | Any authenticated user |
| `POST /auth/2fa/disable` | `@ApiBearerAuth` | Any authenticated user |

### User Profile Endpoints (JWT + Permission)

| Endpoint | Permission | Default "User" Role |
|----------|-----------|-------------------|
| `GET /user/profile` | `user:read` | ✅ Has it |
| `PATCH /user/profile` | `user:update` | ❌ Needs upgrade |
| `PATCH /user/email` | `user:update` | ❌ Needs upgrade |
| `PATCH /user/phone` | `user:update` | ❌ Needs upgrade |
| `PATCH /user/password` | `user:update` | ❌ Needs upgrade |
| `POST /user/profile/avatar` | `user:update` | ❌ Needs upgrade |
| `DELETE /user/profile/avatar` | `user:update` | ❌ Needs upgrade |
| `PATCH /user/notifications` | `user:update` | ❌ Needs upgrade |

> **Note:** The default "User" role only has `user:read`. To allow regular users to update their own profile, either add `user:update` to the "User" role, or create a separate "self:update" permission.

### Permission Endpoints (JWT + Permission)

| Endpoint | Permission |
|----------|-----------|
| `POST /permissions` | `permission:create` |
| `GET /permissions` | `permission:read` |
| `GET /permissions/:id` | `permission:read` |
| `PATCH /permissions/:id` | `permission:update` |
| `DELETE /permissions/:id` | `permission:delete` |

### Role Endpoints (JWT + Permission)

| Endpoint | Permission |
|----------|-----------|
| `POST /roles` | `role:create` |
| `GET /roles` | `role:read` |
| `GET /roles/:id` | `role:read` |
| `PATCH /roles/:id` | `role:update` |
| `DELETE /roles/:id` | `role:delete` |
| `GET /roles/:id/permissions` | `role:read` |
| `POST /roles/:id/permissions` | `role:update` |
| `DELETE /roles/:id/permissions` | `role:update` |
| `POST /roles/assign-to-user` | `role:update` |
| `POST /roles/remove-from-user` | `role:update` |

### Admin User Endpoints (JWT + Permission)

| Endpoint | Permission |
|----------|-----------|
| `GET /admin/users` | `user:read` |
| `GET /admin/users/export` | `user:read` |
| `GET /admin/users/:id` | `user:read` |
| `POST /admin/users` | `user:create` |
| `PATCH /admin/users/:id` | `user:update` |
| `PATCH /admin/users/:id/status` | `user:update` |
| `PATCH /admin/users/:id/suspend` | `user:update` |
| `PATCH /admin/users/:id/restore` | `user:update` |
| `POST /admin/users/:id/reset-password` | `user:update` |
| `POST /admin/users/:id/roles` | `role:update` |
| `DELETE /admin/users/:id/roles` | `role:update` |
| `DELETE /admin/users/:id/soft` | `user:delete` |
| `DELETE /admin/users/:id` | `user:delete` |

---

## API Endpoints — Admin User Management (13)

Base URL: `http://localhost:3000/api/v1`

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | GET | `/admin/users` | `user:read` | List users (paginated, search, filter) |
| 2 | GET | `/admin/users/export` | `user:read` | Export users as JSON |
| 3 | GET | `/admin/users/:id` | `user:read` | Get single user by ID |
| 4 | POST | `/admin/users` | `user:create` | Create user (pre-verified, with roles) |
| 5 | PATCH | `/admin/users/:id` | `user:update` | Update user details |
| 6 | PATCH | `/admin/users/:id/status` | `user:update` | Change user status |
| 7 | PATCH | `/admin/users/:id/suspend` | `user:update` | Suspend user (shortcut) |
| 8 | PATCH | `/admin/users/:id/restore` | `user:update` | Restore soft-deleted user |
| 9 | POST | `/admin/users/:id/reset-password` | `user:update` | Admin reset password + revoke sessions |
| 10 | POST | `/admin/users/:id/roles` | `role:update` | Assign roles to user |
| 11 | DELETE | `/admin/users/:id/roles` | `role:update` | Remove roles from user |
| 12 | DELETE | `/admin/users/:id/soft` | `user:delete` | Soft delete (mark deleted, revoke sessions) |
| 13 | DELETE | `/admin/users/:id` | `user:delete` | Permanent delete (remove all data) |

---

## How to Test Every API

### Prerequisites

1. Start MongoDB + run `npm run start:dev`
2. Register + verify + login as admin user (follow Sprint 1 steps)
3. Assign `super_admin` or `admin` role to your user:

```javascript
// In mongosh
var role = db.roles.findOne({ slug: "super_admin" })
db.users.updateOne(
  { email: "admin@example.com" },
  { $addToSet: { roles: role._id } }
)
```

4. Login again to get a token with the new role:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourPassword",
    "remember_me": false
  }'
```

**Save** the `access_token`.

---

### Step 1: List Users (Paginated)

```bash
# Default — page 1, 10 per page
curl -X GET "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — users array + `meta_data` with pagination info

```json
{
  "success": true,
  "code": 200,
  "data": {
    "users": [...],
    "meta_data": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

#### Pagination

```bash
# Page 2, 5 per page
curl -X GET "http://localhost:3000/api/v1/admin/users?page=2&limit=5" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Search

```bash
# Search by name or email
curl -X GET "http://localhost:3000/api/v1/admin/users?search=john" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Filter by Status

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?status=active" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Filter by Role

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?role=admin" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Sort

```bash
# Sort by email ascending
curl -X GET "http://localhost:3000/api/v1/admin/users?sort_by=email&sort_order=asc" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### Combined

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?search=john&status=active&sort_by=created_at&sort_order=desc&page=1&limit=20" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

| # | Test | Expected |
|---|------|----------|
| 1 | No params | `200` — page 1, 10 items |
| 2 | `?page=2&limit=5` | `200` — page 2, 5 items |
| 3 | `?search=john` | `200` — only matching users |
| 4 | `?status=active` | `200` — only active users |
| 5 | `?role=admin` | `200` — only users with admin role |
| 6 | `?role=nonexistent` | `200` — empty results |
| 7 | No token | `401` — unauthorized |
| 8 | Regular user token (no `user:read` from admin) | `403` — insufficient_permission |

---

### Step 2: Get Single User

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users/<USER_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — User object with roles populated (name + slug)

**Verify:** Sensitive fields excluded: `password_hash`, `email_verification_token`, `password_reset_token`, `two_fa_secret`

| # | Test | Expected |
|---|------|----------|
| 1 | Valid user ID | `200` — user data |
| 2 | Non-existent ID | `404` — `user_not_found` |
| 3 | Invalid ObjectId format | `500` — cast error |

---

### Step 3: Admin Create User

```bash
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Created",
    "last_name": "ByAdmin",
    "email": "created@example.com",
    "password": "AdminCreated1",
    "phone": "+911234567890",
    "status": "active",
    "is_verified": true
  }'
```

**Expected:** `201` — User created with status `active`, `is_verified: true` (no email verification needed)

| # | Test | Expected |
|---|------|----------|
| 1 | Valid data | `201` — user created, default role assigned |
| 2 | With `role_ids` | `201` — user created with specified roles |
| 3 | With invalid `role_ids` | `400` — `invalid_roles` |
| 4 | Duplicate email | `409` — `email_exists` |
| 5 | Missing required fields | `400` — validation error |
| 6 | Password < 8 chars | `400` — validation error |

#### Create with Specific Roles

```bash
# Get role ID first
# In mongosh: db.roles.findOne({ slug: "moderator" }, { _id: 1 })

curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Mod",
    "last_name": "User",
    "email": "mod@example.com",
    "password": "ModPassword1",
    "role_ids": ["<MODERATOR_ROLE_ID>"]
  }'
```

---

### Step 4: Admin Update User

```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/users/<USER_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "UpdatedName",
    "phone": "+919999999999"
  }'
```

| # | Test | Expected |
|---|------|----------|
| 1 | Update name/phone | `200` — updated |
| 2 | Change email to new | `200` — email updated |
| 3 | Change email to taken | `409` — `email_exists` |
| 4 | Non-existent user | `404` — `user_not_found` |
| 5 | Empty body | `200` — no changes |

---

### Step 5: Update User Status

```bash
# Activate
curl -X PATCH "http://localhost:3000/api/v1/admin/users/<USER_ID>/status" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "active" }'

# Suspend
curl -X PATCH "http://localhost:3000/api/v1/admin/users/<USER_ID>/status" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "suspended" }'

# Lock
curl -X PATCH "http://localhost:3000/api/v1/admin/users/<USER_ID>/status" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "locked" }'
```

| # | Test | Expected |
|---|------|----------|
| 1 | Set `active` | `200` — status changed, lock cleared |
| 2 | Set `suspended` | `200` — status changed |
| 3 | Set `locked` | `200` — status changed |
| 4 | Invalid status | `400` — validation error |

---

### Step 6: Suspend User (Shortcut)

```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/users/<USER_ID>/suspend" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — `User status updated to 'suspended'`

---

### Step 7: Admin Reset Password

```bash
curl -X POST "http://localhost:3000/api/v1/admin/users/<USER_ID>/reset-password" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "new_password": "ResetByAdmin1" }'
```

**Expected:** `200` — Password changed, all sessions revoked, lock cleared

| # | Test | Expected |
|---|------|----------|
| 1 | Valid password | `200` — password reset |
| 2 | Password < 8 chars | `400` — validation error |
| 3 | Non-existent user | `404` — `user_not_found` |

### Verify — login with new password:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "created@example.com",
    "password": "ResetByAdmin1",
    "remember_me": false
  }'
```

---

### Step 8: Assign Roles to User

```bash
# Get role IDs first
# mongosh: db.roles.find({}, { name: 1, slug: 1 })

curl -X POST "http://localhost:3000/api/v1/admin/users/<USER_ID>/roles" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": ["<ADMIN_ROLE_ID>"]
  }'
```

| # | Test | Expected |
|---|------|----------|
| 1 | Valid role IDs | `200` — roles assigned (uses `$addToSet`, no duplicates) |
| 2 | Already assigned | `200` — idempotent |
| 3 | Invalid role IDs | `400` — `invalid_roles` |
| 4 | Non-existent user | `404` — `user_not_found` |

---

### Step 9: Remove Roles from User

```bash
curl -X DELETE "http://localhost:3000/api/v1/admin/users/<USER_ID>/roles" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": ["<ADMIN_ROLE_ID>"]
  }'
```

**Expected:** `200` — Roles removed

---

### Step 10: Soft Delete User

```bash
curl -X DELETE "http://localhost:3000/api/v1/admin/users/<USER_ID>/soft" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — User marked as deleted, status set to `inactive`, all sessions revoked

| # | Test | Expected |
|---|------|----------|
| 1 | Valid user | `200` — soft deleted |
| 2 | Already deleted user | `400` — `already_deleted` |
| 3 | Non-existent user | `404` — `user_not_found` |

### Verify in DB:

```javascript
db.users.findOne({ _id: ObjectId("<USER_ID>") }, { is_deleted: 1, deleted_at: 1, status: 1 })
// Expected: is_deleted: true, deleted_at: <timestamp>, status: "inactive"
```

### Verify user cannot login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "created@example.com",
    "password": "ResetByAdmin1",
    "remember_me": false
  }'
```

**Expected:** `401` — user not found (findByEmail filters `is_deleted: false`)

---

### Step 11: Restore Soft-Deleted User

```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/users/<USER_ID>/restore" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — User restored, `is_deleted: false`, status back to `active`

| # | Test | Expected |
|---|------|----------|
| 1 | Deleted user | `200` — restored |
| 2 | Non-deleted user | `400` — `not_deleted` |
| 3 | Non-existent user | `404` — `user_not_found` |

---

### Step 12: Hard Delete User (Permanent)

```bash
curl -X DELETE "http://localhost:3000/api/v1/admin/users/<USER_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — User permanently deleted, all refresh tokens deleted

| # | Test | Expected |
|---|------|----------|
| 1 | Valid user | `200` — permanently deleted |
| 2 | Non-existent user | `404` — `user_not_found` |

### Verify:

```javascript
db.users.findOne({ _id: ObjectId("<USER_ID>") })
// Expected: null (gone)

db.refreshtokens.find({ user_id: ObjectId("<USER_ID>") })
// Expected: empty
```

---

### Step 13: Export Users

```bash
# Export all users
curl -X GET "http://localhost:3000/api/v1/admin/users/export" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Export filtered
curl -X GET "http://localhost:3000/api/v1/admin/users/export?status=active&search=john" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — JSON with total, exported_at, and users array (limited fields)

```json
{
  "success": true,
  "code": 200,
  "data": {
    "total": 3,
    "exported_at": "2026-03-13T...",
    "users": [
      {
        "_id": "...",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "+919876543210",
        "status": "active",
        "is_verified": true,
        "last_login_at": "...",
        "created_at": "...",
        "roles": [{ "name": "User", "slug": "user" }]
      }
    ]
  }
}
```

---

### Step 14: Test Permission Enforcement

```bash
# Register a normal user (has only "user" role with user:read)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Normal",
    "last_name": "User",
    "email": "normal@example.com",
    "password": "NormalP@ss1"
  }'

# Verify + login as normal user...

# Try admin endpoints with normal user token
curl -X GET "http://localhost:3000/api/v1/admin/users" \
  -H "Authorization: Bearer <NORMAL_USER_TOKEN>"
```

**Expected:** `403` — `insufficient_permission` (normal "User" role only has `user:read`, but admin list also needs `user:read` — so this actually works! The difference is in `user:create`, `user:update`, `user:delete` which the normal user does NOT have.)

```bash
# Try to create user as normal user
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer <NORMAL_USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "email": "test@example.com",
    "password": "TestP@ss1"
  }'
```

**Expected:** `403` — `insufficient_permission` (requires `user:create`)

---

## Useful MongoDB Queries

```javascript
// ── List users with roles ──
db.users.aggregate([
  { $lookup: { from: "roles", localField: "roles", foreignField: "_id", as: "roles" } },
  { $project: { first_name: 1, email: 1, status: 1, is_deleted: 1, "roles.name": 1, "roles.slug": 1 } }
])

// ── Find users by status ──
db.users.find({ status: "active" }, { first_name: 1, email: 1, status: 1 })

// ── Find soft-deleted users ──
db.users.find({ is_deleted: true }, { first_name: 1, email: 1, deleted_at: 1 })

// ── Count users by status ──
db.users.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// ── Count users by role ──
db.users.aggregate([
  { $unwind: "$roles" },
  { $lookup: { from: "roles", localField: "roles", foreignField: "_id", as: "role" } },
  { $unwind: "$role" },
  { $group: { _id: "$role.slug", count: { $sum: 1 } } }
])

// ── Assign super_admin to user ──
var role = db.roles.findOne({ slug: "super_admin" })
db.users.updateOne(
  { email: "admin@example.com" },
  { $addToSet: { roles: role._id } }
)

// ── Clean up test data ──
db.users.deleteMany({ email: { $in: ["created@example.com", "mod@example.com", "normal@example.com"] } })
```

---

## Feature Implementation Details

### Pagination

- Default: page 1, 10 per page
- Max 100 per page
- Returns `meta_data: { page, limit, total, total_pages }`
- Runs count query in parallel with data query for performance

### Search

- Case-insensitive regex search across `first_name`, `last_name`, `email`
- Uses `$or` operator
- Combinable with status and role filters

### Admin vs Self-Service

| Feature | Self-Service (`/user/*`) | Admin (`/admin/users/*`) |
|---------|------------------------|-------------------------|
| View profile | Own only | Any user |
| Update profile | Own only | Any user |
| Change password | Requires current password | Sets new directly |
| Change email | Triggers re-verification | Direct change, no re-verification |
| Delete | Not available | Soft + hard delete |
| Change status | Not available | Any status |
| Assign roles | Not available | Full role management |
| Create user | Via registration only | Pre-verified, with roles |

### Admin Response Projection

Admin endpoints return more fields than self-service (includes `is_deleted`, `deleted_at`, `failed_login_attempts`, `locked_until`) but still excludes:
- `password_hash`
- `email_verification_token` / `email_verification_expires`
- `password_reset_token` / `password_reset_expires`
- `two_fa_secret`

### Soft Delete vs Hard Delete

| | Soft Delete | Hard Delete |
|---|------------|-------------|
| User record | Marked `is_deleted: true` | Permanently removed |
| Sessions | Revoked | Deleted |
| Reversible | Yes (restore endpoint) | No |
| Login blocked | Yes (`findByEmail` filters) | Yes (user gone) |
| Shows in admin list | Yes (with `is_deleted` flag) | No |

---

## Swagger UI

After starting the app, visit: `http://localhost:3000/api-docs`

New section: **Admin - Users** — 13 endpoints for full user lifecycle management

All require Bearer token + appropriate permission.
