# Sprint 9 — Analytics & User Groups (Complete)

## Summary

Sprint 9 adds two modules: **Analytics** for admin dashboard data using MongoDB aggregation pipelines, and **User Groups** for team-based access control with role inheritance. The analytics module provides 8 endpoints covering user counts, growth trends, login activity, role distribution, and chart data. The group module provides 10 endpoints for full CRUD plus user/role membership management and resolved permission queries.

---

## Files Created / Modified

### New — Analytics Module (3 files)

| File | Purpose |
|------|---------|
| `src/modules/analytics/analytics.module.ts` | Module registration, imports User/LoginAttempt/Session schemas |
| `src/modules/analytics/analytics.service.ts` | 7 aggregation methods + 1 combined dashboard overview |
| `src/modules/analytics/analytics.controller.ts` | 8 GET endpoints under `/admin/analytics` |

### New — Group Module (8 files)

| File | Purpose |
|------|---------|
| `src/modules/group/group.module.ts` | Module registration, exports GroupService |
| `src/modules/group/group.service.ts` | Full CRUD + user/role membership + resolved permissions |
| `src/modules/group/group.controller.ts` | 10 endpoints under `/admin/groups` |
| `src/modules/group/schemas/user-group.schema.ts` | UserGroup MongoDB schema |
| `src/modules/group/dto/create-group.dto.ts` | Create DTO with slug validation |
| `src/modules/group/dto/update-group.dto.ts` | Update DTO (name, description, is_active) |
| `src/modules/group/dto/group-users.dto.ts` | User IDs array DTO |
| `src/modules/group/dto/group-roles.dto.ts` | Role IDs array DTO |

### Modified

| File | Changes |
|------|---------|
| `src/app.module.ts` | Imported `AnalyticsModule` + `GroupModule` |
| `src/modules/audit/audit.interceptor.ts` | Added 7 group route patterns to `AUDIT_MAP` |

---

## Database Schema — UserGroup

| Field | Type | Description |
|-------|------|-------------|
| `name` | String (required, trimmed) | Group display name |
| `slug` | String (required, unique, lowercase) | URL-friendly identifier |
| `description` | String (trimmed) | Optional group description |
| `roles` | ObjectId[] (ref Role) | Roles assigned to this group |
| `users` | ObjectId[] (ref User) | Users belonging to this group |
| `is_active` | Boolean (default: false) | Whether the group is active |
| `created_at` | Date | Auto-generated timestamp |
| `updated_at` | Date | Auto-generated timestamp |

**Indexes:** `slug` (unique), `users`, `roles`, `is_active`

---

## Existing Utils Used

| Util | Used For |
|------|----------|
| `ErrorEntity` + `HttpStatus` | Error responses (404, 409) in GroupService |
| `ResultEntity` | Success responses via global interceptor |
| `@Permissions()` decorator | Endpoint-level permission checks |

---

## API Endpoints — Analytics (8)

Base URL: `http://localhost:3000/api/v1`

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | GET | `/admin/analytics/overview` | `analytics:read` | Combined dashboard (users + activity + status + roles) |
| 2 | GET | `/admin/analytics/users/total` | `analytics:read` | Total, verified, unverified, deleted counts |
| 3 | GET | `/admin/analytics/users/active` | `analytics:read` | Active in 24h, 7d, 30d + active sessions |
| 4 | GET | `/admin/analytics/users/status` | `analytics:read` | Users grouped by status enum |
| 5 | GET | `/admin/analytics/users/growth` | `analytics:read` | New users per day/week/month |
| 6 | GET | `/admin/analytics/users/chart` | `analytics:read` | Cumulative + daily new users for charts |
| 7 | GET | `/admin/analytics/logins` | `analytics:read` | Login success/failed per day |
| 8 | GET | `/admin/analytics/roles` | `analytics:read` | Users per role ($lookup aggregation) |

## API Endpoints — Groups (10)

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | POST | `/admin/groups` | `group:create` | Create a new group |
| 2 | GET | `/admin/groups` | `group:read` | List groups (paginated, searchable) |
| 3 | GET | `/admin/groups/:id` | `group:read` | Get group with populated roles & users |
| 4 | PATCH | `/admin/groups/:id` | `group:update` | Update group details |
| 5 | DELETE | `/admin/groups/:id` | `group:delete` | Delete a group |
| 6 | POST | `/admin/groups/:id/users` | `group:update` | Add users to group |
| 7 | DELETE | `/admin/groups/:id/users` | `group:update` | Remove users from group |
| 8 | POST | `/admin/groups/:id/roles` | `group:update` | Assign roles to group |
| 9 | DELETE | `/admin/groups/:id/roles` | `group:update` | Remove roles from group |
| 10 | GET | `/admin/groups/:id/permissions` | `group:read` | Resolved permissions from all group roles |

---

## Audit Interceptor — New Group Actions (7)

| Action | Route | Description |
|--------|-------|-------------|
| `group.create` | `POST /admin/groups` | Created group |
| `group.update` | `PATCH /admin/groups/:id` | Updated group |
| `group.delete` | `DELETE /admin/groups/:id` | Deleted group |
| `group.add_users` | `POST /admin/groups/:id/users` | Added users to group |
| `group.remove_users` | `DELETE /admin/groups/:id/users` | Removed users from group |
| `group.assign_roles` | `POST /admin/groups/:id/roles` | Assigned roles to group |
| `group.remove_roles` | `DELETE /admin/groups/:id/roles` | Removed roles from group |

---

## How to Test

### Prerequisites

1. Start MongoDB + run `npm run start:dev`
2. Login as admin/super_admin user (needs `analytics:read` + `group:create/read/update/delete` permissions)
3. Save the `access_token`

---

### Analytics — Step 1: Dashboard Overview

```bash
curl -X GET "http://localhost:3000/api/v1/admin/analytics/overview" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Combined dashboard data

```json
{
  "success": true,
  "code": 200,
  "data": {
    "users": {
      "total": 50,
      "verified": 45,
      "unverified": 5,
      "deleted": 2
    },
    "activity": {
      "active_24h": 12,
      "active_7d": 30,
      "active_30d": 48,
      "active_sessions": 8
    },
    "status_breakdown": [
      { "status": "active", "count": 40 },
      { "status": "pending", "count": 5 },
      { "status": "suspended", "count": 3 }
    ],
    "role_distribution": [
      { "role_slug": "user", "role_name": "User", "count": 45 },
      { "role_slug": "admin", "role_name": "Admin", "count": 3 }
    ]
  }
}
```

---

### Analytics — Step 2: Total Users

```bash
curl -X GET "http://localhost:3000/api/v1/admin/analytics/users/total" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — `{ total, verified, unverified, deleted }`

---

### Analytics — Step 3: Active Users

```bash
curl -X GET "http://localhost:3000/api/v1/admin/analytics/users/active" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — `{ active_24h, active_7d, active_30d, active_sessions }`

---

### Analytics — Step 4: Users by Status

```bash
curl -X GET "http://localhost:3000/api/v1/admin/analytics/users/status" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Array of `{ status, count }`

---

### Analytics — Step 5: User Growth

```bash
# Daily growth (last 30 days)
curl -X GET "http://localhost:3000/api/v1/admin/analytics/users/growth?period=day&days=30" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Weekly growth (last 90 days)
curl -X GET "http://localhost:3000/api/v1/admin/analytics/users/growth?period=week&days=90" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Monthly growth (last 365 days)
curl -X GET "http://localhost:3000/api/v1/admin/analytics/users/growth?period=month&days=365" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Array of `{ period, count }`

```json
{
  "success": true,
  "code": 200,
  "data": [
    { "period": "2026-03-10", "count": 3 },
    { "period": "2026-03-11", "count": 5 },
    { "period": "2026-03-12", "count": 2 },
    { "period": "2026-03-13", "count": 1 }
  ]
}
```

---

### Analytics — Step 6: User Chart Data

```bash
# Default 90 days
curl -X GET "http://localhost:3000/api/v1/admin/analytics/users/chart" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Custom period
curl -X GET "http://localhost:3000/api/v1/admin/analytics/users/chart?days=180" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Cumulative + daily new users

```json
{
  "success": true,
  "code": 200,
  "data": {
    "period_days": 90,
    "start_date": "2025-12-13",
    "base_count": 20,
    "chart": [
      { "date": "2026-01-05", "new_users": 2, "total_users": 22 },
      { "date": "2026-01-06", "new_users": 1, "total_users": 23 },
      { "date": "2026-01-10", "new_users": 3, "total_users": 26 }
    ]
  }
}
```

---

### Analytics — Step 7: Login Activity

```bash
# Default 30 days
curl -X GET "http://localhost:3000/api/v1/admin/analytics/logins" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Custom period
curl -X GET "http://localhost:3000/api/v1/admin/analytics/logins?days=7" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Success/failed logins per day

```json
{
  "success": true,
  "code": 200,
  "data": [
    { "date": "2026-03-10", "successful": 15, "failed": 3, "total": 18 },
    { "date": "2026-03-11", "successful": 20, "failed": 1, "total": 21 },
    { "date": "2026-03-12", "successful": 18, "failed": 5, "total": 23 }
  ]
}
```

---

### Analytics — Step 8: Role Distribution

```bash
curl -X GET "http://localhost:3000/api/v1/admin/analytics/roles" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Users per role

```json
{
  "success": true,
  "code": 200,
  "data": [
    { "role_slug": "user", "role_name": "User", "count": 45 },
    { "role_slug": "moderator", "role_name": "Moderator", "count": 5 },
    { "role_slug": "admin", "role_name": "Admin", "count": 3 },
    { "role_slug": "super_admin", "role_name": "Super Admin", "count": 1 }
  ]
}
```

---

### Groups — Step 1: Create a Group

```bash
curl -X POST "http://localhost:3000/api/v1/admin/groups" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Team",
    "slug": "engineering-team",
    "description": "All engineering team members",
    "is_active": true
  }'
```

**Expected:** `201` — Created group object

```json
{
  "success": true,
  "code": 201,
  "data": {
    "_id": "...",
    "name": "Engineering Team",
    "slug": "engineering-team",
    "description": "All engineering team members",
    "roles": [],
    "users": [],
    "is_active": true,
    "created_at": "2026-03-13T...",
    "updated_at": "2026-03-13T..."
  }
}
```

---

### Groups — Step 2: Create with Roles

```bash
curl -X POST "http://localhost:3000/api/v1/admin/groups" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing Team",
    "slug": "marketing-team",
    "description": "Marketing department",
    "role_ids": ["<ROLE_ID>"],
    "is_active": true
  }'
```

---

### Groups — Step 3: List Groups

```bash
# Default pagination
curl -X GET "http://localhost:3000/api/v1/admin/groups" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Search by name or slug
curl -X GET "http://localhost:3000/api/v1/admin/groups?search=engineering" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Filter active only
curl -X GET "http://localhost:3000/api/v1/admin/groups?is_active=true" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Paginated
curl -X GET "http://localhost:3000/api/v1/admin/groups?page=1&limit=10" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Groups array + meta_data

```json
{
  "success": true,
  "code": 200,
  "data": {
    "groups": [
      {
        "_id": "...",
        "name": "Engineering Team",
        "slug": "engineering-team",
        "description": "All engineering team members",
        "roles": [
          { "_id": "...", "name": "User", "slug": "user" }
        ],
        "users": ["..."],
        "is_active": true,
        "created_at": "2026-03-13T..."
      }
    ],
    "meta_data": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "total_pages": 1
    }
  }
}
```

---

### Groups — Step 4: Get Group by ID

```bash
curl -X GET "http://localhost:3000/api/v1/admin/groups/<GROUP_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Group with populated roles (name, slug, permissions) and users (first_name, last_name, email)

---

### Groups — Step 5: Update Group

```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/groups/<GROUP_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Team v2",
    "description": "Updated engineering team",
    "is_active": true
  }'
```

**Expected:** `200` — Updated group object

---

### Groups — Step 6: Add Users to Group

```bash
curl -X POST "http://localhost:3000/api/v1/admin/groups/<GROUP_ID>/users" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["<USER_ID_1>", "<USER_ID_2>"]
  }'
```

**Expected:** `200` — Group with populated users array

---

### Groups — Step 7: Remove Users from Group

```bash
curl -X DELETE "http://localhost:3000/api/v1/admin/groups/<GROUP_ID>/users" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["<USER_ID_1>"]
  }'
```

**Expected:** `200` — Group with updated users array

---

### Groups — Step 8: Assign Roles to Group

```bash
curl -X POST "http://localhost:3000/api/v1/admin/groups/<GROUP_ID>/roles" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": ["<ROLE_ID_1>", "<ROLE_ID_2>"]
  }'
```

**Expected:** `200` — Group with populated roles array

---

### Groups — Step 9: Remove Roles from Group

```bash
curl -X DELETE "http://localhost:3000/api/v1/admin/groups/<GROUP_ID>/roles" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": ["<ROLE_ID_1>"]
  }'
```

**Expected:** `200` — Group with updated roles array

---

### Groups — Step 10: Get Resolved Permissions

```bash
curl -X GET "http://localhost:3000/api/v1/admin/groups/<GROUP_ID>/permissions" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — Flattened, deduplicated permissions from all group roles

```json
{
  "success": true,
  "code": 200,
  "data": {
    "group_id": "...",
    "group_name": "Engineering Team",
    "permissions": [
      { "_id": "...", "name": "Read User", "slug": "user:read", "category": "user" },
      { "_id": "...", "name": "Update User", "slug": "user:update", "category": "user" },
      { "_id": "...", "name": "Read Session", "slug": "session:read", "category": "session" }
    ],
    "total": 3
  }
}
```

---

### Groups — Step 11: Duplicate Slug

```bash
curl -X POST "http://localhost:3000/api/v1/admin/groups" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another Engineering",
    "slug": "engineering-team"
  }'
```

**Expected:** `409` — `group_exists`

---

### Groups — Step 12: Delete Group

```bash
curl -X DELETE "http://localhost:3000/api/v1/admin/groups/<GROUP_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200` — `{ deleted: true }`

---

### Groups — Step 13: Permission Enforcement

```bash
# Login as regular user (no group permissions)
curl -X GET "http://localhost:3000/api/v1/admin/groups" \
  -H "Authorization: Bearer <REGULAR_USER_TOKEN>"
```

**Expected:** `403` — `insufficient_permission`

---

## Useful MongoDB Queries

```javascript
// ── Analytics ──

// Total users by status
db.users.aggregate([
  { $match: { is_deleted: { $ne: true } } },
  { $group: { _id: "$status", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Active users in last 7 days
db.users.countDocuments({
  last_login_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  is_deleted: { $ne: true }
})

// Login activity per day (last 30 days)
db.loginattempts.aggregate([
  { $match: { created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
  { $group: {
    _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, success: "$success" },
    count: { $sum: 1 }
  }},
  { $sort: { "_id.date": 1 } }
])

// Role distribution
db.users.aggregate([
  { $match: { is_deleted: { $ne: true } } },
  { $unwind: "$roles" },
  { $lookup: { from: "roles", localField: "roles", foreignField: "_id", as: "role" } },
  { $unwind: "$role" },
  { $group: { _id: "$role.slug", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// New users per day (last 30 days)
db.users.aggregate([
  { $match: { created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
  { $group: {
    _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
    count: { $sum: 1 }
  }},
  { $sort: { _id: 1 } }
])

// ── Groups ──

// All groups
db.usergroups.find().sort({ created_at: -1 })

// Groups for a specific user
db.usergroups.find({ users: ObjectId("<USER_ID>") })

// Groups with a specific role
db.usergroups.find({ roles: ObjectId("<ROLE_ID>") })

// Active groups only
db.usergroups.find({ is_active: true })

// Group with populated roles and users
db.usergroups.aggregate([
  { $match: { _id: ObjectId("<GROUP_ID>") } },
  { $lookup: { from: "roles", localField: "roles", foreignField: "_id", as: "roles" } },
  { $lookup: { from: "users", localField: "users", foreignField: "_id", as: "users" } }
])

// All permissions for a group (resolved from roles)
db.usergroups.aggregate([
  { $match: { _id: ObjectId("<GROUP_ID>") } },
  { $lookup: { from: "roles", localField: "roles", foreignField: "_id", as: "roles" } },
  { $unwind: "$roles" },
  { $lookup: { from: "permissions", localField: "roles.permissions", foreignField: "_id", as: "perms" } },
  { $unwind: "$perms" },
  { $group: { _id: "$perms.slug", name: { $first: "$perms.name" } } },
  { $sort: { _id: 1 } }
])

// Collection stats
db.usergroups.estimatedDocumentCount()
```

---

## Architecture

### Analytics — Aggregation Pipeline Pattern

```
Controller (GET request)
    → AnalyticsService method
        → MongoDB aggregation pipeline ($match → $group → $sort → $project)
        → Returns structured data for charts/dashboards
```

All analytics queries use `Promise.all()` for parallel execution where possible (e.g., dashboard overview runs 4 queries simultaneously).

### Groups — Role Inheritance Model

```
UserGroup
    ├── roles[] ──→ Role
    │                ├── permissions[] ──→ Permission
    │                └── permissions[] ──→ Permission
    ├── roles[] ──→ Role
    │                └── permissions[] ──→ Permission
    └── users[] ──→ User

GET /groups/:id/permissions
    → Populate roles with their permissions
    → Flatten all permissions
    → Deduplicate by _id
    → Return unique permission set
```

### Membership Operations

| Operation | MongoDB Operator | Behavior |
|-----------|-----------------|----------|
| Add users/roles | `$addToSet` + `$each` | Prevents duplicates |
| Remove users/roles | `$pull` + `$in` | Removes matching IDs |

---

## Sprint 9 Task Completion

### Analytics Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Total users count | ✅ `GET /admin/analytics/users/total` |
| 2 | Active users count | ✅ `GET /admin/analytics/users/active` |
| 3 | New users per day/week/month | ✅ `GET /admin/analytics/users/growth` |
| 4 | Login activity over time | ✅ `GET /admin/analytics/logins` |
| 5 | Role distribution | ✅ `GET /admin/analytics/roles` |
| 6 | User growth chart data | ✅ `GET /admin/analytics/users/chart` |
| — | Dashboard overview (bonus) | ✅ `GET /admin/analytics/overview` |
| — | Users by status (bonus) | ✅ `GET /admin/analytics/users/status` |

### Group Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Create group | ✅ `POST /admin/groups` |
| 2 | Edit group | ✅ `PATCH /admin/groups/:id` |
| 3 | Delete group | ✅ `DELETE /admin/groups/:id` |
| 4 | Add users to group | ✅ `POST /admin/groups/:id/users` |
| 5 | Remove users from group | ✅ `DELETE /admin/groups/:id/users` |
| 6 | Assign role to group | ✅ `POST /admin/groups/:id/roles` |
| 7 | Group permissions | ✅ `GET /admin/groups/:id/permissions` |
| — | Remove roles from group (bonus) | ✅ `DELETE /admin/groups/:id/roles` |
| — | List groups paginated (bonus) | ✅ `GET /admin/groups` |
| — | Get groups by user (bonus) | ✅ Service method `getGroupsByUser()` |

---

## Swagger UI

After starting the app, visit: `http://localhost:3000/api-docs`

New sections:
- **Admin - Analytics** — 8 endpoints for dashboard data and chart APIs
- **Admin - Groups** — 10 endpoints for group CRUD and membership management

All require Bearer token + appropriate permissions (`analytics:read`, `group:create/read/update/delete`).
