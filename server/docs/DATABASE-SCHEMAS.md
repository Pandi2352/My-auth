# Database Schemas (MongoDB)

## 1. User

```typescript
{
  _id: ObjectId,
  email: string,                    // unique, indexed
  password_hash: string,
  first_name: string,
  last_name: string,
  phone: string,
  avatar_url: string,
  roles: [ObjectId],                // ref: Role
  groups: [ObjectId],               // ref: UserGroup

  // Status
  status: string,                   // 'active' | 'inactive' | 'suspended' | 'pending' | 'locked'
  is_verified: boolean,             // email verified
  is_2fa_enabled: boolean,
  two_fa_secret: string,

  // Security
  failed_login_attempts: number,
  locked_until: Date,
  password_changed_at: Date,
  password_expires_at: Date,

  // Tracking
  last_login_at: Date,
  last_login_ip: string,
  last_login_device: string,

  // Preferences
  notification_preferences: {
    email_on_login: boolean,
    email_on_password_change: boolean,
    email_on_security_alert: boolean,
  },

  // Metadata
  invited_by: ObjectId,
  source: string,                   // 'registration' | 'invitation' | 'admin' | 'social'
  social_provider: string,          // 'google' | 'github' | null
  social_provider_id: string,

  // Soft delete
  is_deleted: boolean,
  deleted_at: Date,

  created_at: Date,
  updated_at: Date,
}
```

**Indexes:** `email` (unique), `status`, `roles`, `created_at`, `is_deleted`

---

## 2. Role

```typescript
{
  _id: ObjectId,
  name: string,                     // unique, e.g. 'admin', 'user', 'moderator'
  slug: string,                     // unique, URL-safe
  description: string,
  permissions: [ObjectId],          // ref: Permission
  is_default: boolean,              // assigned to new users
  is_system: boolean,               // cannot be deleted (super_admin, etc.)

  created_at: Date,
  updated_at: Date,
}
```

**Indexes:** `slug` (unique), `is_default`

---

## 3. Permission

```typescript
{
  _id: ObjectId,
  name: string,                     // e.g. 'Create User'
  slug: string,                     // e.g. 'user:create'
  module: string,                   // e.g. 'user', 'role', 'permission', 'audit'
  action: string,                   // e.g. 'create', 'read', 'update', 'delete'
  description: string,

  created_at: Date,
  updated_at: Date,
}
```

**Indexes:** `slug` (unique), `module`

---

## 4. RefreshToken

```typescript
{
  _id: ObjectId,
  user_id: ObjectId,                // ref: User
  token_hash: string,               // hashed refresh token
  device: string,
  ip_address: string,
  user_agent: string,
  is_revoked: boolean,
  expires_at: Date,

  created_at: Date,
}
```

**Indexes:** `user_id`, `token_hash`, `expires_at` (TTL)

---

## 5. Session

```typescript
{
  _id: ObjectId,
  user_id: ObjectId,                // ref: User
  token_hash: string,
  device: string,
  ip_address: string,
  location: {                       // from IPToLocationUtils
    country: string,
    region: string,
    city: string,
    geo_position: {
      lat: number,
      lng: number,
    }
  },
  user_agent: string,               // parsed via UserAgentHelper
  browser: string,
  os: string,
  is_active: boolean,
  last_activity_at: Date,
  expires_at: Date,

  created_at: Date,
}
```

**Indexes:** `user_id`, `is_active`, `expires_at` (TTL)

---

## 6. LoginAttempt

```typescript
{
  _id: ObjectId,
  user_id: ObjectId,                // ref: User (nullable for unknown emails)
  email: string,
  ip_address: string,
  user_agent: string,
  success: boolean,
  failure_reason: string,           // 'invalid_password' | 'account_locked' | 'not_verified'

  created_at: Date,
}
```

**Indexes:** `user_id`, `ip_address`, `created_at` (TTL: 30 days)

---

## 7. AuditLog

```typescript
{
  _id: ObjectId,
  user_id: ObjectId,                // who performed the action
  action: string,                   // 'user:create', 'role:update', 'auth:login', etc.
  target_type: string,              // 'user', 'role', 'permission', 'session'
  target_id: ObjectId,              // the affected document
  changes: {
    before: object,                 // previous state (for updates)
    after: object,                  // new state (for updates)
  },
  ip_address: string,
  user_agent: string,
  metadata: object,                 // any extra context

  created_at: Date,
}
```

**Indexes:** `user_id`, `action`, `target_type`, `created_at`

---

## 8. UserGroup

```typescript
{
  _id: ObjectId,
  name: string,                     // unique
  description: string,
  roles: [ObjectId],                // ref: Role — inherited by all members
  users: [ObjectId],                // ref: User
  created_by: ObjectId,

  created_at: Date,
  updated_at: Date,
}
```

**Indexes:** `name` (unique), `users`

---

## 9. Invitation

```typescript
{
  _id: ObjectId,
  email: string,
  role_id: ObjectId,                // ref: Role
  token: string,                    // unique invite token
  invited_by: ObjectId,             // ref: User
  accepted_at: Date,                // null if pending
  expires_at: Date,

  created_at: Date,
}
```

**Indexes:** `token` (unique), `email`, `expires_at` (TTL)

---

## 10. SystemConfig

```typescript
{
  _id: ObjectId,
  key: string,                      // unique, e.g. 'auth.token_expiry'
  value: any,                       // mixed type
  category: string,                 // 'auth', 'email', 'security', 'general'
  description: string,
  updated_by: ObjectId,

  updated_at: Date,
}
```

**Indexes:** `key` (unique), `category`

---

## 11. ApiKey

```typescript
{
  _id: ObjectId,
  user_id: ObjectId,                // ref: User
  name: string,                     // label, e.g. 'Production API Key'
  key_hash: string,                 // hashed API key
  key_prefix: string,               // first 8 chars for identification
  permissions: [string],            // e.g. ['user:read', 'user:create']
  is_active: boolean,
  last_used_at: Date,
  expires_at: Date,

  created_at: Date,
}
```

**Indexes:** `user_id`, `key_hash` (unique), `is_active`

---

## Default Seed Data

### Roles

| Name | Slug | Default | System |
|------|------|---------|--------|
| Super Admin | super_admin | No | Yes |
| Admin | admin | No | Yes |
| User | user | Yes | No |

### Permissions

| Module | Actions |
|--------|---------|
| user | create, read, update, delete |
| role | create, read, update, delete |
| permission | create, read, update, delete |
| session | read, delete |
| audit | read, export |
| analytics | read |
| group | create, read, update, delete |
| settings | read, update |
