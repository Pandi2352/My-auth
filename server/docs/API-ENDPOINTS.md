# API Endpoints Reference

> All endpoints prefixed with `/api/v1`
> Auth required unless marked with `[Public]`

---

## 1. Authentication — `/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login (returns access + refresh token) | Public |
| POST | `/auth/logout` | Logout (revoke current token) | Yes |
| POST | `/auth/refresh` | Refresh access token | Public (refresh token) |
| POST | `/auth/verify-email` | Verify email with token | Public |
| POST | `/auth/resend-verification` | Resend verification email | Public |
| POST | `/auth/forgot-password` | Send password reset email | Public |
| POST | `/auth/reset-password` | Reset password with token | Public |
| POST | `/auth/2fa/enable` | Enable 2FA (returns QR code) | Yes |
| POST | `/auth/2fa/verify` | Verify 2FA token | Yes |
| POST | `/auth/2fa/disable` | Disable 2FA | Yes |
| GET | `/auth/google` | Google OAuth login | Public |
| GET | `/auth/google/callback` | Google OAuth callback | Public |
| GET | `/auth/github` | GitHub OAuth login | Public |
| GET | `/auth/github/callback` | GitHub OAuth callback | Public |

---

## 2. User Profile — `/user`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/user/profile` | Get own profile | Yes |
| PATCH | `/user/profile` | Update profile | Yes |
| PATCH | `/user/email` | Update email (triggers re-verification) | Yes |
| PATCH | `/user/phone` | Update phone number | Yes |
| PATCH | `/user/password` | Change password | Yes |
| POST | `/user/profile/avatar` | Upload profile image | Yes |
| DELETE | `/user/profile/avatar` | Remove profile image | Yes |
| PATCH | `/user/notifications` | Update notification preferences | Yes |
| GET | `/user/data-export` | Export own data (GDPR) | Yes |
| DELETE | `/user/account` | Delete own account (GDPR) | Yes |
| POST | `/user/api-keys` | Create API key | Yes |
| GET | `/user/api-keys` | List own API keys | Yes |
| DELETE | `/user/api-keys/:id` | Revoke API key | Yes |

---

## 3. Admin — Users — `/admin/users`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/admin/users` | List users (paginated, searchable) | `user:read` |
| GET | `/admin/users/:id` | Get user by ID | `user:read` |
| POST | `/admin/users` | Create user | `user:create` |
| PATCH | `/admin/users/:id` | Edit user | `user:update` |
| DELETE | `/admin/users/:id` | Hard delete user | `user:delete` |
| DELETE | `/admin/users/:id/soft` | Soft delete user | `user:delete` |
| PATCH | `/admin/users/:id/status` | Change user status | `user:update` |
| PATCH | `/admin/users/:id/suspend` | Suspend user | `user:update` |
| POST | `/admin/users/:id/reset-password` | Reset user password | `user:update` |
| POST | `/admin/users/:id/roles` | Assign role to user | `user:update` |
| DELETE | `/admin/users/:id/roles/:roleId` | Remove role from user | `user:update` |
| POST | `/admin/users/import` | Bulk import (CSV) | `user:create` |
| GET | `/admin/users/export` | Bulk export (CSV) | `user:read` |
| POST | `/admin/impersonate/:id` | Login as user | `user:impersonate` |

---

## 4. Roles — `/roles`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/roles` | List all roles | `role:read` |
| GET | `/roles/:id` | Get role by ID | `role:read` |
| POST | `/roles` | Create role | `role:create` |
| PATCH | `/roles/:id` | Edit role | `role:update` |
| DELETE | `/roles/:id` | Delete role | `role:delete` |
| POST | `/roles/:id/clone` | Clone role | `role:create` |
| PATCH | `/roles/:id/default` | Set as default role | `role:update` |
| GET | `/roles/:id/permissions` | View role permissions | `role:read` |
| POST | `/roles/:id/permissions` | Assign permissions | `role:update` |
| DELETE | `/roles/:id/permissions` | Remove permissions | `role:update` |

---

## 5. Permissions — `/permissions`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/permissions` | List all permissions | `permission:read` |
| GET | `/permissions/:id` | Get permission by ID | `permission:read` |
| POST | `/permissions` | Create permission | `permission:create` |
| PATCH | `/permissions/:id` | Edit permission | `permission:update` |
| DELETE | `/permissions/:id` | Delete permission | `permission:delete` |
| GET | `/permissions/matrix` | Role vs permission matrix | `permission:read` |

---

## 6. Sessions — `/sessions`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/sessions` | List own active sessions | Authenticated |
| DELETE | `/sessions/current` | Logout current session | Authenticated |
| DELETE | `/sessions/all` | Logout all sessions | Authenticated |
| DELETE | `/sessions/:id` | Terminate specific session | Authenticated |

---

## 7. Audit Logs — `/admin/audit-logs`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/admin/audit-logs` | List audit logs (paginated) | `audit:read` |
| GET | `/admin/audit-logs/:id` | Get audit log detail | `audit:read` |
| GET | `/admin/audit-logs/export` | Export logs (CSV/JSON) | `audit:export` |

### Query Parameters

```
?user_id=xxx          Filter by user
?action=user:create   Filter by action
?target_type=user     Filter by target type
?from=2024-01-01      Date range start
?to=2024-01-31        Date range end
?page=1&limit=20      Pagination
?sort=created_at:desc Sorting
```

---

## 8. User Groups — `/groups`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/groups` | List all groups | `group:read` |
| GET | `/groups/:id` | Get group by ID | `group:read` |
| POST | `/groups` | Create group | `group:create` |
| PATCH | `/groups/:id` | Edit group | `group:update` |
| DELETE | `/groups/:id` | Delete group | `group:delete` |
| POST | `/groups/:id/users` | Add users to group | `group:update` |
| DELETE | `/groups/:id/users/:userId` | Remove user from group | `group:update` |
| POST | `/groups/:id/roles` | Assign role to group | `group:update` |
| DELETE | `/groups/:id/roles/:roleId` | Remove role from group | `group:update` |
| GET | `/groups/:id/permissions` | View effective permissions | `group:read` |

---

## 9. Analytics — `/admin/analytics`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/admin/analytics/users/total` | Total user count | `analytics:read` |
| GET | `/admin/analytics/users/active` | Active user count | `analytics:read` |
| GET | `/admin/analytics/users/growth` | New users over time | `analytics:read` |
| GET | `/admin/analytics/logins` | Login activity | `analytics:read` |
| GET | `/admin/analytics/roles` | Role distribution | `analytics:read` |

---

## 10. Notifications — `/admin/notifications`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/admin/invitations` | Send user invitation | `user:create` |
| GET | `/admin/invitations` | List invitations | `user:read` |
| DELETE | `/admin/invitations/:id` | Cancel invitation | `user:delete` |

---

## 11. System Config — `/admin/settings`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/admin/settings` | Get all settings | `settings:read` |
| GET | `/admin/settings/:category` | Get settings by category | `settings:read` |
| PATCH | `/admin/settings` | Update settings | `settings:update` |

---

## Common Response Format

### Success

```json
{
  "success": true,
  "code": 200,
  "data": { },
  "meta_data": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Error

```json
{
  "success": false,
  "code": 400,
  "error": {
    "error": "invalid_request",
    "error_description": "Email is already registered"
  }
}
```
