# Sprint-Wise Development Plan

> Each sprint = 2 weeks

---

## Sprint 1 — Authentication (Core)

**Priority:** Critical
**Goal:** Users can register, login, and securely authenticate.

### Database Schemas

- `User` — email, password_hash, is_verified, is_active, failed_login_attempts, locked_until, created_at, updated_at
- `RefreshToken` — user_id, token, device_info, ip_address, expires_at, created_at

### Tasks

| # | Task | Endpoint | Status |
|---|------|----------|--------|
| 1 | User registration | `POST /auth/register` | |
| 2 | Email verification (send + verify) | `POST /auth/verify-email` | |
| 3 | User login (JWT access + refresh) | `POST /auth/login` | |
| 4 | User logout | `POST /auth/logout` | |
| 5 | Refresh token | `POST /auth/refresh` | |
| 6 | Forgot password (send reset email) | `POST /auth/forgot-password` | |
| 7 | Reset password (via token) | `POST /auth/reset-password` | |
| 8 | Password strength validation | Validation pipe | |
| 9 | Account lock after failed attempts | Login service logic | |
| 10 | Remember me (extended token expiry) | `POST /auth/login` flag | |

### Deliverables

- Auth module with JWT strategy (access + refresh)
- Passport.js local strategy
- Global validation pipe
- Email service integration (verification + password reset)
- Password hashing with bcrypt
- Rate limiting on login endpoint

---

## Sprint 2 — User Profile Management

**Priority:** Critical
**Goal:** Authenticated users can view and manage their profile.

### Database Schema Updates

- `User` — add: phone, avatar_url, notification_preferences, last_login_at, last_login_ip

### Tasks

| # | Task | Endpoint | Status |
|---|------|----------|--------|
| 1 | View own profile | `GET /user/profile` | |
| 2 | Edit profile (name, phone, etc.) | `PATCH /user/profile` | |
| 3 | Update email (with re-verification) | `PATCH /user/email` | |
| 4 | Update phone number | `PATCH /user/phone` | |
| 5 | Upload profile image | `POST /user/profile/avatar` | |
| 6 | Change password | `PATCH /user/password` | |
| 7 | Manage notification preferences | `PATCH /user/notifications` | |
| 8 | View last login info | `GET /user/profile` (included) | |
| 9 | View account status | `GET /user/profile` (included) | |

### Deliverables

- User module with CRUD
- File upload (avatar) — local or S3
- @CurrentUser decorator
- Profile DTOs with validation

---

## Sprint 3 — Role & Permission Management

**Priority:** High
**Goal:** Admin can create roles and permissions, assign permissions to roles.

### Database Schemas

- `Role` — name, slug, description, permissions[], is_default, created_at, updated_at
- `Permission` — name, slug, module, action, description, created_at, updated_at

### Tasks

| # | Task | Endpoint | Status |
|---|------|----------|--------|
| 1 | Create role | `POST /roles` | |
| 2 | Edit role | `PATCH /roles/:id` | |
| 3 | Delete role | `DELETE /roles/:id` | |
| 4 | View all roles | `GET /roles` | |
| 5 | Clone role | `POST /roles/:id/clone` | |
| 6 | Set default role | `PATCH /roles/:id/default` | |
| 7 | Assign permissions to role | `POST /roles/:id/permissions` | |
| 8 | Remove permissions from role | `DELETE /roles/:id/permissions` | |
| 9 | View role permissions | `GET /roles/:id/permissions` | |
| 10 | Create permission | `POST /permissions` | |
| 11 | Edit permission | `PATCH /permissions/:id` | |
| 12 | Delete permission | `DELETE /permissions/:id` | |
| 13 | View all permissions | `GET /permissions` | |
| 14 | Permission matrix view | `GET /permissions/matrix` | |

### Deliverables

- Role module with full CRUD
- Permission module with full CRUD
- Role-Permission relationship (many-to-many)
- Seed script for default roles and permissions

---

## Sprint 4 — Authorization & Access Control (RBAC)

**Priority:** High
**Goal:** Routes and APIs are protected by role and permission checks.

### Tasks

| # | Task | Type | Status |
|---|------|------|--------|
| 1 | @Roles() decorator | Decorator | |
| 2 | @Permissions() decorator | Decorator | |
| 3 | RolesGuard | Guard | |
| 4 | PermissionsGuard | Guard | |
| 5 | JwtAuthGuard (global) | Guard | |
| 6 | Public route decorator (@Public) | Decorator | |
| 7 | Apply guards to all existing endpoints | Integration | |
| 8 | CASL integration (optional) | Service | |

### Deliverables

- RBAC fully integrated across all modules
- Guards applied globally via APP_GUARD
- @Public decorator for open routes (register, login, etc.)
- All existing endpoints secured

---

## Sprint 5 — Admin User Management

**Priority:** High
**Goal:** Admins can manage all users in the system.

### Tasks

| # | Task | Endpoint | Status |
|---|------|----------|--------|
| 1 | List all users (paginated) | `GET /admin/users` | |
| 2 | Search users | `GET /admin/users?search=` | |
| 3 | Filter users (status, role, date) | `GET /admin/users?filter=` | |
| 4 | Create user | `POST /admin/users` | |
| 5 | Edit user | `PATCH /admin/users/:id` | |
| 6 | Delete user (hard) | `DELETE /admin/users/:id` | |
| 7 | Soft delete user | `DELETE /admin/users/:id/soft` | |
| 8 | Activate / deactivate user | `PATCH /admin/users/:id/status` | |
| 9 | Suspend user | `PATCH /admin/users/:id/suspend` | |
| 10 | Reset user password | `POST /admin/users/:id/reset-password` | |
| 11 | Assign role to user | `POST /admin/users/:id/roles` | |
| 12 | Remove role from user | `DELETE /admin/users/:id/roles` | |
| 13 | Bulk import users (CSV) | `POST /admin/users/import` | |
| 14 | Bulk export users | `GET /admin/users/export` | |

### Deliverables

- Admin user controller (separate from user self-service)
- Pagination utility (reusable)
- CSV import/export service
- Admin-only route protection

---

## Sprint 6 — Session Management & Security

**Priority:** Medium
**Goal:** Track active sessions and harden security.

### Database Schemas

- `Session` — user_id, token_hash, device, ip_address, location, user_agent, is_active, created_at, expires_at
- `LoginAttempt` — user_id, ip_address, success, created_at

### Tasks — Session Management

| # | Task | Endpoint | Status |
|---|------|----------|--------|
| 1 | View active sessions | `GET /sessions` | |
| 2 | Track login device & user agent | Login service | |
| 3 | Track IP address | Login service | |
| 4 | Track login location (IP-to-location util) | Login service | |
| 5 | Logout current session | `DELETE /sessions/current` | |
| 6 | Logout all sessions | `DELETE /sessions/all` | |
| 7 | Terminate specific session | `DELETE /sessions/:id` | |

### Tasks — Security

| # | Task | Type | Status |
|---|------|------|--------|
| 1 | Rate limiting (throttler) | Global | |
| 2 | Login attempt tracking | Service | |
| 3 | IP blocking | Guard/Middleware | |
| 4 | CAPTCHA verification | `POST /auth/login` | |
| 5 | Two-factor authentication (TOTP) | `POST /auth/2fa/*` | |
| 6 | Password expiration policy | Middleware | |
| 7 | Session timeout | Config | |
| 8 | CSRF protection | Middleware | |
| 9 | Helmet (XSS, headers) | Global middleware | |

### Deliverables

- Session module
- ThrottlerModule integration
- 2FA with TOTP (using existing TOTPHelper)
- Security middleware stack (helmet, CSRF)

---

## Sprint 7 — User Status & Notifications

**Priority:** Medium
**Goal:** Manage user statuses and send email notifications.

### Tasks — User Status

| # | Task | Type | Status |
|---|------|------|--------|
| 1 | Status enum (active, inactive, suspended, pending, locked) | Schema | |
| 2 | Status transitions with validation | Service | |
| 3 | Auto-lock on failed attempts | Service | |
| 4 | Auto-pending on registration | Service | |
| 5 | Admin status change | Endpoint | |

### Tasks — Notifications

| # | Task | Type | Status |
|---|------|------|--------|
| 1 | Email template service | Service | |
| 2 | Account verification email | Template | |
| 3 | Password reset email | Template | |
| 4 | New user invitation email | Template | |
| 5 | Security alert email (new device login) | Template | |
| 6 | Admin notification (new user, suspicious activity) | Service | |
| 7 | Notification preferences (email on/off) | User setting | |

### Deliverables

- User status state machine
- Notification module with email templates
- Integration with existing SMTPEmailer utility

---

## Sprint 8 — Audit & Activity Logging

**Priority:** Medium
**Goal:** Track all important system actions for compliance.

### Database Schema

- `AuditLog` — user_id, action, target_type, target_id, changes (before/after), ip_address, user_agent, created_at

### Tasks

| # | Task | Endpoint | Status |
|---|------|----------|--------|
| 1 | Audit log schema & service | Service | |
| 2 | Log user login/logout | Interceptor | |
| 3 | Log user creation/update/deletion | Interceptor | |
| 4 | Log role changes | Interceptor | |
| 5 | Log permission changes | Interceptor | |
| 6 | Log password reset | Service | |
| 7 | View audit logs (paginated) | `GET /admin/audit-logs` | |
| 8 | Filter audit logs (user, action, date) | `GET /admin/audit-logs?filter=` | |
| 9 | Export audit logs (CSV/JSON) | `GET /admin/audit-logs/export` | |

### Deliverables

- AuditLog module
- Global audit interceptor (auto-log on mutations)
- Admin audit log viewer with filtering
- Export functionality

---

## Sprint 9 — Analytics & User Groups

**Priority:** Low
**Goal:** Admin dashboard data and team-based access control.

### Tasks — Analytics

| # | Task | Endpoint | Status |
|---|------|----------|--------|
| 1 | Total users count | `GET /admin/analytics/users/total` | |
| 2 | Active users count | `GET /admin/analytics/users/active` | |
| 3 | New users per day/week/month | `GET /admin/analytics/users/growth` | |
| 4 | Login activity over time | `GET /admin/analytics/logins` | |
| 5 | Role distribution | `GET /admin/analytics/roles` | |
| 6 | User growth chart data | `GET /admin/analytics/users/chart` | |

### Tasks — User Groups / Teams

| # | Task | Endpoint | Status |
|---|------|----------|--------|
| 1 | Create group | `POST /groups` | |
| 2 | Edit group | `PATCH /groups/:id` | |
| 3 | Delete group | `DELETE /groups/:id` | |
| 4 | Add users to group | `POST /groups/:id/users` | |
| 5 | Remove users from group | `DELETE /groups/:id/users` | |
| 6 | Assign role to group | `POST /groups/:id/roles` | |
| 7 | Group permissions | `GET /groups/:id/permissions` | |

### Database Schema

- `UserGroup` — name, description, roles[], users[], created_at, updated_at

### Deliverables

- Analytics module with aggregation pipelines
- UserGroup module with role inheritance
- Admin dashboard endpoints

---

## Sprint 10 — Enterprise & System Configuration

**Priority:** Low
**Goal:** Advanced features for enterprise-grade systems.

### Tasks — Enterprise Features

| # | Task | Type | Status |
|---|------|------|--------|
| 1 | User invitation system | `POST /admin/invitations` | |
| 2 | Temporary access (time-limited roles) | Service | |
| 3 | Feature flags per user | Schema + Service | |
| 4 | API keys per user | `POST /user/api-keys` | |
| 5 | Admin impersonation | `POST /admin/impersonate/:id` | |
| 6 | User data export (GDPR) | `GET /user/data-export` | |
| 7 | Account deletion (GDPR) | `DELETE /user/account` | |
| 8 | Account recovery | `POST /auth/recover-account` | |
| 9 | Social login (Google, GitHub) | `GET /auth/google`, `GET /auth/github` | |
| 10 | SSO support (SAML/OAuth) | Integration | |

### Tasks — System Configuration

| # | Task | Endpoint | Status |
|---|------|----------|--------|
| 1 | App settings (site name, logo, etc.) | `GET/PATCH /admin/settings` | |
| 2 | Auth settings (token expiry, password policy) | `GET/PATCH /admin/settings/auth` | |
| 3 | Email settings (SMTP config) | `GET/PATCH /admin/settings/email` | |
| 4 | Security settings (rate limits, IP whitelist) | `GET/PATCH /admin/settings/security` | |

### Database Schema

- `SystemConfig` — key, value, category, description, updated_by, updated_at
- `Invitation` — email, role_id, token, expires_at, accepted_at, invited_by
- `ApiKey` — user_id, key_hash, name, permissions[], last_used_at, expires_at

### Deliverables

- System config module (key-value store)
- Invitation flow with email
- API key management
- GDPR compliance endpoints
- Social login with Passport strategies

---

## Dependencies Summary

```
Sprint 1  ──▶  Sprint 2  ──▶  Sprint 5
   │                              │
   ▼                              ▼
Sprint 3  ──▶  Sprint 4  ──▶  Sprint 5
                                  │
Sprint 6 ◀───────────────────────┘
   │
   ▼
Sprint 7  ──▶  Sprint 8  ──▶  Sprint 9  ──▶  Sprint 10
```

## NPM Packages Needed

| Package | Sprint | Purpose |
|---------|--------|---------|
| `@nestjs/jwt` | 1 | JWT token generation |
| `@nestjs/passport` | 1 | Auth strategies |
| `passport-jwt` | 1 | JWT strategy |
| `passport-local` | 1 | Local strategy |
| `class-validator` | 1 | DTO validation |
| `class-transformer` | 1 | DTO transformation |
| `@nestjs/throttler` | 6 | Rate limiting |
| `helmet` | 6 | Security headers |
| `multer` | 2 | File upload |
| `csv-parse` | 5 | CSV import |
| `json2csv` | 5 | CSV export |
| `passport-google-oauth20` | 10 | Google login |
| `passport-github2` | 10 | GitHub login |
| `@casl/ability` | 4 | Advanced RBAC (optional) |
