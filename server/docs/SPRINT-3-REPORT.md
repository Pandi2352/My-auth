# Sprint 3 — Role & Permission Management (Complete)

## Summary

Sprint 3 delivers the full RBAC (Role-Based Access Control) system including permission CRUD, role CRUD, permission-to-role assignment, role-to-user assignment, RBAC guards (`@Roles`, `@Permissions` decorators), and automatic seeding of default roles and permissions on application startup. New users are automatically assigned the default "User" role upon registration.

---

## Files Created / Modified

### New — Enums & Constants

| File | Purpose |
|------|---------|
| `src/common/enums/permission-action.enum.ts` | `PermissionAction` enum: create, read, update, delete |
| `src/common/constants/index.ts` | Added `ROLES_KEY`, `PERMISSIONS_KEY` |

### New — Decorators

| File | Purpose |
|------|---------|
| `src/common/decorators/roles.decorator.ts` | `@Roles('admin', 'super_admin')` — requires specific role slugs |
| `src/common/decorators/permissions.decorator.ts` | `@Permissions('user:create')` — requires specific permission slugs |

### New — Guards

| File | Purpose |
|------|---------|
| `src/common/guards/roles.guard.ts` | Checks if user has at least one of the required roles (OR logic) |
| `src/common/guards/permissions.guard.ts` | Checks if user has ALL required permissions (AND logic) |

### New — Permission Module

| File | Purpose |
|------|---------|
| `src/modules/permission/schemas/permission.schema.ts` | Permission Mongoose schema |
| `src/modules/permission/dto/create-permission.dto.ts` | Create permission DTO with validation |
| `src/modules/permission/dto/update-permission.dto.ts` | Update permission DTO (all optional) |
| `src/modules/permission/permission.service.ts` | Permission CRUD + upsert for seeding |
| `src/modules/permission/permission.controller.ts` | Permission REST endpoints |
| `src/modules/permission/permission.module.ts` | Module registration |

### New — Role Module

| File | Purpose |
|------|---------|
| `src/modules/role/schemas/role.schema.ts` | Role Mongoose schema |
| `src/modules/role/dto/create-role.dto.ts` | Create role DTO |
| `src/modules/role/dto/update-role.dto.ts` | Update role DTO |
| `src/modules/role/dto/assign-permissions.dto.ts` | Permission assignment DTO |
| `src/modules/role/dto/assign-roles.dto.ts` | Role-to-user assignment DTO |
| `src/modules/role/role.service.ts` | Role CRUD + permission/user assignment |
| `src/modules/role/role.controller.ts` | Role REST endpoints |
| `src/modules/role/role.module.ts` | Module registration |

### New — Seed Module

| File | Purpose |
|------|---------|
| `src/modules/seed/seed.service.ts` | Seeds 24 permissions + 4 roles on app bootstrap |
| `src/modules/seed/seed.module.ts` | Seed module registration |

### Modified

| File | Changes |
|------|---------|
| `src/modules/user/schemas/user.schema.ts` | Added `roles` field (ObjectId[] ref to Role) + index |
| `src/modules/user/user.service.ts` | Added `findByIdWithRolesAndPermissions()`, `assignRoles()`, `removeRoles()`, `removeRoleFromAllUsers()` |
| `src/modules/auth/strategies/jwt.strategy.ts` | `validate()` now populates roles + permissions on `req.user` |
| `src/modules/auth/auth.service.ts` | `register()` now assigns default role to new users |
| `src/modules/auth/auth.module.ts` | Imports `RoleModule` for default role assignment |
| `src/app.module.ts` | Imports `PermissionModule`, `RoleModule`, `SeedModule`; registers `RolesGuard`, `PermissionsGuard` as global guards |

---

## Existing Utils Used

| Util | Used For |
|------|----------|
| `ErrorEntity` + `HttpStatus` | All error responses (not_found, conflict, forbidden, bad_request) |
| `ResultEntity` | All success responses via global interceptor |

---

## Database Collections (New)

| Collection | Description |
|------------|-------------|
| `permissions` | Permission definitions (slug, module, action) |
| `roles` | Role definitions with permission references |

### Modified Collection

| Collection | Change |
|------------|--------|
| `users` | Added `roles` field (array of Role ObjectId references) |

---

## Seeded Data (Auto on Startup)

### 24 Permissions

| Module | Permissions |
|--------|-------------|
| user | `user:create`, `user:read`, `user:update`, `user:delete` |
| role | `role:create`, `role:read`, `role:update`, `role:delete` |
| permission | `permission:create`, `permission:read`, `permission:update`, `permission:delete` |
| session | `session:read`, `session:delete` |
| audit | `audit:read` |
| analytics | `analytics:read` |
| group | `group:create`, `group:read`, `group:update`, `group:delete` |
| settings | `settings:read`, `settings:update` |

### 4 Roles

| Role | Slug | System | Default | Permissions |
|------|------|--------|---------|-------------|
| Super Admin | `super_admin` | Yes | No | ALL 24 permissions |
| Admin | `admin` | Yes | No | All except `settings:update` (23) |
| Moderator | `moderator` | No | No | `user:read`, `user:update`, `group:read`, `group:update`, `session:read`, `audit:read` (6) |
| User | `user` | No | Yes | `user:read` (1) |

---

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

All endpoints require `Authorization: Bearer <access_token>` and the user must have the appropriate permission.

### Permission Endpoints (5)

| # | Method | Endpoint | Required Permission | Description |
|---|--------|----------|-------------------|-------------|
| 1 | POST | `/permissions` | `permission:create` | Create a new permission |
| 2 | GET | `/permissions` | `permission:read` | List all permissions |
| 3 | GET | `/permissions/:id` | `permission:read` | Get permission by ID |
| 4 | PATCH | `/permissions/:id` | `permission:update` | Update a permission |
| 5 | DELETE | `/permissions/:id` | `permission:delete` | Delete a permission |

### Role Endpoints (10)

| # | Method | Endpoint | Required Permission | Description |
|---|--------|----------|-------------------|-------------|
| 6 | POST | `/roles` | `role:create` | Create a new role |
| 7 | GET | `/roles` | `role:read` | List all roles |
| 8 | GET | `/roles/:id` | `role:read` | Get role by ID (with populated permissions) |
| 9 | PATCH | `/roles/:id` | `role:update` | Update a role |
| 10 | DELETE | `/roles/:id` | `role:delete` | Delete a role (blocked for system roles) |
| 11 | GET | `/roles/:id/permissions` | `role:read` | Get permissions of a role |
| 12 | POST | `/roles/:id/permissions` | `role:update` | Assign permissions to a role |
| 13 | DELETE | `/roles/:id/permissions` | `role:update` | Remove permissions from a role |
| 14 | POST | `/roles/assign-to-user` | `role:update` | Assign roles to a user |
| 15 | POST | `/roles/remove-from-user` | `role:update` | Remove roles from a user |

---

## RBAC Guard Behavior

### How It Works

1. **JWT Strategy** populates `req.user.roles` with full role objects (including nested permissions)
2. **RolesGuard** checks `@Roles()` decorator — user needs **at least one** matching role slug (OR)
3. **PermissionsGuard** checks `@Permissions()` decorator — user needs **ALL** listed permission slugs (AND)
4. Both guards skip `@Public()` routes
5. If no `@Roles()` or `@Permissions()` decorator is present, the endpoint is accessible to any authenticated user

### Guard Execution Order

```
Request → JwtAuthGuard → ThrottlerGuard → RolesGuard → PermissionsGuard → Controller
```

### Permission Check Flow

```
User logs in → JWT issued
    ↓
Request with Bearer token
    ↓
JwtStrategy.validate() → fetches user with populated roles & permissions
    ↓
req.user = { _id, email, status, roles: [{ slug, permissions: [{ slug }] }] }
    ↓
PermissionsGuard flattens: roles → permissions → Set<slug>
    ↓
Checks required permissions against user's permission set
    ↓
✓ Allow  or  ✗ 403 insufficient_permission
```

---

## How to Test Every API

### Prerequisites

1. Start MongoDB locally
2. Run `npm run start:dev`
3. On startup, check console for: `Seeded 24 permissions` and `Seeded 4 roles`

---

### Step 1: Register and Login (Get Access Token)

```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@example.com",
    "password": "StrongP@ss1"
  }'
```

### Step 2: Verify Email and Login

```javascript
// Get verification token from DB
db.users.findOne({ email: "admin@example.com" }, { email_verification_token: 1 })
```

```bash
# Verify email
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{ "token": "<VERIFICATION_TOKEN>" }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongP@ss1",
    "remember_me": false
  }'
```

**Save the `access_token`** from login response.

---

### Step 3: Assign Admin/Super Admin Role to Your User

> New users only get the "User" role (which has `user:read` only). You need to upgrade your user to `super_admin` or `admin` to test role/permission endpoints.

```javascript
// In mongosh — find role IDs and user ID
db.roles.find({}, { name: 1, slug: 1 })
db.users.findOne({ email: "admin@example.com" }, { _id: 1, roles: 1 })

// Assign super_admin role to your user
var superAdminRole = db.roles.findOne({ slug: "super_admin" })
db.users.updateOne(
  { email: "admin@example.com" },
  { $addToSet: { roles: superAdminRole._id } }
)
```

**IMPORTANT:** After assigning the role, your next request with the access token will automatically pick up the new role (JWT strategy re-fetches user with roles on each request).

---

### Step 4: Test Permission Endpoints

#### 4.1 List All Permissions

```bash
curl -X GET http://localhost:3000/api/v1/permissions \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Array of 24 seeded permissions

#### 4.2 Get Permission by ID

```bash
curl -X GET http://localhost:3000/api/v1/permissions/<PERMISSION_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Single permission object

#### 4.3 Create a Custom Permission

```bash
curl -X POST http://localhost:3000/api/v1/permissions \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Export Reports",
    "slug": "report:export",
    "module": "report",
    "action": "read",
    "description": "Export report data"
  }'
```

**Expected:** `201` — Permission created

| # | Test | Expected |
|---|------|----------|
| 1 | Valid data | `201` — created |
| 2 | Duplicate slug | `409` — `permission_exists` |
| 3 | Missing required fields | `400` — validation error |
| 4 | Invalid action (not in enum) | `400` — validation error |

#### 4.4 Update a Permission

```bash
curl -X PATCH http://localhost:3000/api/v1/permissions/<PERMISSION_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description"
  }'
```

**Expected:** `200` — Updated permission

#### 4.5 Delete a Permission

```bash
curl -X DELETE http://localhost:3000/api/v1/permissions/<PERMISSION_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Permission deleted

| # | Test | Expected |
|---|------|----------|
| 1 | Valid ID | `200` — deleted |
| 2 | Non-existent ID | `404` — `permission_not_found` |

---

### Step 5: Test Role Endpoints

#### 5.1 List All Roles

```bash
curl -X GET http://localhost:3000/api/v1/roles \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Array of 4 seeded roles

#### 5.2 Get Role by ID (with Permissions)

```bash
curl -X GET http://localhost:3000/api/v1/roles/<ROLE_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Role object with `permissions` array populated (full permission objects, not just IDs)

#### 5.3 Create a Custom Role

```bash
curl -X POST http://localhost:3000/api/v1/roles \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Editor",
    "slug": "editor",
    "description": "Can edit content"
  }'
```

**Expected:** `201` — Role created

| # | Test | Expected |
|---|------|----------|
| 1 | Valid data | `201` — created |
| 2 | Duplicate slug | `409` — `role_exists` |
| 3 | Missing name/slug | `400` — validation error |
| 4 | With `permission_ids` | `201` — created with permissions attached |
| 5 | With invalid `permission_ids` | `400` — `invalid_permissions` |

#### 5.4 Update a Role

```bash
curl -X PATCH http://localhost:3000/api/v1/roles/<ROLE_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated role description"
  }'
```

| # | Test | Expected |
|---|------|----------|
| 1 | Update non-system role | `200` — updated |
| 2 | Change slug/name of system role (super_admin, admin) | `403` — `system_role` |
| 3 | Update description of system role | `200` — allowed |
| 4 | Non-existent ID | `404` — `role_not_found` |

#### 5.5 Delete a Role

```bash
curl -X DELETE http://localhost:3000/api/v1/roles/<ROLE_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

| # | Test | Expected |
|---|------|----------|
| 1 | Delete non-system role (editor) | `200` — deleted, removed from all users |
| 2 | Delete system role (admin, super_admin) | `403` — `system_role` |
| 3 | Non-existent ID | `404` — `role_not_found` |

---

### Step 6: Test Permission Assignment to Roles

#### 6.1 Get Role Permissions

```bash
curl -X GET http://localhost:3000/api/v1/roles/<ROLE_ID>/permissions \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** `200` — Array of permission objects for this role

#### 6.2 Assign Permissions to a Role

```bash
curl -X POST http://localhost:3000/api/v1/roles/<ROLE_ID>/permissions \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_ids": ["<PERMISSION_ID_1>", "<PERMISSION_ID_2>"]
  }'
```

**Expected:** `200` — Role updated with new permissions (uses `$addToSet`, no duplicates)

| # | Test | Expected |
|---|------|----------|
| 1 | Valid permission IDs | `200` — permissions added |
| 2 | Already assigned permissions | `200` — no duplicates, idempotent |
| 3 | Invalid permission IDs | `400` — `invalid_permissions` |
| 4 | Non-existent role ID | `404` — `role_not_found` |

#### 6.3 Remove Permissions from a Role

```bash
curl -X DELETE http://localhost:3000/api/v1/roles/<ROLE_ID>/permissions \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_ids": ["<PERMISSION_ID_1>"]
  }'
```

**Expected:** `200` — Permission removed from role

---

### Step 7: Test Role Assignment to Users

#### 7.1 Assign Roles to a User

```bash
curl -X POST http://localhost:3000/api/v1/roles/assign-to-user \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<USER_ID>",
    "role_ids": ["<ROLE_ID>"]
  }'
```

**Expected:** `200` — User updated with new roles

| # | Test | Expected |
|---|------|----------|
| 1 | Valid user + role IDs | `200` — roles assigned |
| 2 | Already assigned role | `200` — no duplicates, idempotent |
| 3 | Invalid role IDs | `400` — `invalid_roles` |
| 4 | Non-existent user ID | `404` — `user_not_found` |

#### 7.2 Remove Roles from a User

```bash
curl -X POST http://localhost:3000/api/v1/roles/remove-from-user \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<USER_ID>",
    "role_ids": ["<ROLE_ID>"]
  }'
```

**Expected:** `200` — Roles removed from user

---

### Step 8: Test RBAC Guards (Permission Enforcement)

#### 8.1 Test with Regular User (Only `user:read` Permission)

```bash
# Register a new regular user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Regular",
    "last_name": "User",
    "email": "regular@example.com",
    "password": "StrongP@ss1"
  }'

# Verify email (get token from DB), then login
# ... (follow Sprint 1 steps)
```

```bash
# Try to list permissions — regular user only has user:read
curl -X GET http://localhost:3000/api/v1/permissions \
  -H "Authorization: Bearer <REGULAR_USER_TOKEN>"
```

**Expected:** `403` — `insufficient_permission` (requires `permission:read`)

```bash
# Try to list roles
curl -X GET http://localhost:3000/api/v1/roles \
  -H "Authorization: Bearer <REGULAR_USER_TOKEN>"
```

**Expected:** `403` — `insufficient_permission` (requires `role:read`)

```bash
# Try to access own profile — no permission decorator, just needs auth
curl -X GET http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer <REGULAR_USER_TOKEN>"
```

**Expected:** `200` — Profile returned (no `@Permissions` on profile endpoint)

#### 8.2 Test with Admin User (Has Most Permissions)

```javascript
// Assign admin role to regular user
var adminRole = db.roles.findOne({ slug: "admin" })
db.users.updateOne(
  { email: "regular@example.com" },
  { $addToSet: { roles: adminRole._id } }
)
```

```bash
# Now try to list permissions
curl -X GET http://localhost:3000/api/v1/permissions \
  -H "Authorization: Bearer <REGULAR_USER_TOKEN>"
```

**Expected:** `200` — Works now (admin has `permission:read`)

#### 8.3 Test with No Auth

```bash
curl -X GET http://localhost:3000/api/v1/roles
```

**Expected:** `401` — Unauthorized (JWT required)

---

## Useful MongoDB Queries

```javascript
// ── View all permissions ──
db.permissions.find({}, { name: 1, slug: 1, module: 1, action: 1 }).sort({ module: 1 })

// ── View all roles with permission count ──
db.roles.aggregate([
  { $project: { name: 1, slug: 1, is_system: 1, is_default: 1, permCount: { $size: "$permissions" } } }
])

// ── View role with populated permissions ──
db.roles.aggregate([
  { $match: { slug: "admin" } },
  { $lookup: { from: "permissions", localField: "permissions", foreignField: "_id", as: "permissions" } },
  { $project: { name: 1, slug: 1, "permissions.name": 1, "permissions.slug": 1 } }
])

// ── View user with roles ──
db.users.aggregate([
  { $match: { email: "admin@example.com" } },
  { $lookup: { from: "roles", localField: "roles", foreignField: "_id", as: "roles" } },
  { $project: { first_name: 1, email: 1, "roles.name": 1, "roles.slug": 1 } }
])

// ── Assign super_admin role to a user ──
var role = db.roles.findOne({ slug: "super_admin" })
db.users.updateOne(
  { email: "admin@example.com" },
  { $addToSet: { roles: role._id } }
)

// ── Remove all roles from a user ──
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { roles: [] } }
)

// ── Check what permissions a user has (via roles) ──
db.users.aggregate([
  { $match: { email: "admin@example.com" } },
  { $lookup: { from: "roles", localField: "roles", foreignField: "_id", as: "roles" } },
  { $unwind: "$roles" },
  { $lookup: { from: "permissions", localField: "roles.permissions", foreignField: "_id", as: "roles.permissions" } },
  { $unwind: "$roles.permissions" },
  { $group: { _id: "$email", permissions: { $addToSet: "$roles.permissions.slug" } } }
])

// ── Find which roles have a specific permission ──
var perm = db.permissions.findOne({ slug: "user:delete" })
db.roles.find({ permissions: perm._id }, { name: 1, slug: 1 })

// ── Reset — delete all RBAC data ──
db.permissions.deleteMany({})
db.roles.deleteMany({})
db.users.updateMany({}, { $set: { roles: [] } })
```

---

## Schema Details

### Permission Schema

```
{
  name:        String (required, trimmed)      — "User Create"
  slug:        String (required, unique, lower) — "user:create"
  module:      String (required, lower)         — "user"
  action:      Enum   (create|read|update|delete)
  description: String                           — "Create user resources"
  created_at:  Date (auto)
  updated_at:  Date (auto)
}

Indexes: slug (unique), module, module+action
```

### Role Schema

```
{
  name:        String     (required, trimmed)   — "Super Admin"
  slug:        String     (required, unique, lower) — "super_admin"
  description: String                           — "Full system access"
  permissions: ObjectId[] (ref: Permission)     — [...]
  is_default:  Boolean    (default: false)      — auto-assigned on registration
  is_system:   Boolean    (default: false)      — cannot be deleted
  created_at:  Date (auto)
  updated_at:  Date (auto)
}

Indexes: slug (unique), is_default
```

### User Schema (Modified)

```
{
  // ...existing fields...
  roles: ObjectId[] (ref: Role, default: [])    — assigned roles
}

New Index: roles
```

---

## Feature Implementation Details

### Default Role on Registration

When a new user registers via `/auth/register`, the system automatically:
1. Creates the user with `status: "pending"`
2. Finds the default role (where `is_default: true` — "User" role)
3. Assigns it to the user's `roles` array
4. Sends verification email

### System Role Protection

Roles with `is_system: true` (super_admin, admin):
- **Cannot be deleted** — returns `403 system_role`
- **Cannot have name/slug changed** — returns `403 system_role`
- **CAN have permissions modified** — allows customization
- **CAN have description changed** — allows documentation updates

### Seed Idempotency

The seed service runs on every app startup using `findOneAndUpdate` with `upsert: true`:
- If data exists → updates it (no duplicates)
- If data missing → creates it
- Safe to restart the app multiple times

### RBAC Guard Logic

- **@Roles('admin', 'moderator')** — User must have **at least one** of these roles (OR)
- **@Permissions('user:create', 'user:read')** — User must have **ALL** of these permissions (AND)
- Guards skip `@Public()` routes automatically
- No decorator = accessible to any authenticated user

---

## Swagger UI

After starting the app, visit: `http://localhost:3000/api-docs`

New sections:
- **Permissions** — 5 endpoints for permission CRUD
- **Roles** — 10 endpoints for role CRUD + assignment

All require Bearer token authorization.
