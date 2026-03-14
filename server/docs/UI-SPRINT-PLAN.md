# Frontend UI Sprint Plan — NestJS User Management System

> Complete sprint-by-sprint plan to build a full admin dashboard and user-facing UI.
> **16 Sprints** covering every backend feature with screen designs, components, and API mappings.

---

## Tech Stack Recommendation

| Layer        | Recommended                                      | Alternatives                   |
| ------------ | ------------------------------------------------ | ------------------------------ |
| Framework    | React TS vite latest                             |
| UI Library   | Tailwind CSS 4                                   |
| State        | React Context                                    |
| HTTP Client  | **Axios** with interceptors                      | fetch, Angular HttpClient      |
| Charts       | **Recharts**                                     | Chart.js, ApexCharts           |
| Forms        | **React Hook Form** + Zod                        | Formik, Angular Reactive Forms |
| Auth Storage | **HttpOnly Cookies** (preferred) or localStorage |                                |
| Icons        | **Lucide React**                                 | Heroicons, Phosphor            |
| Toast/Alerts | **Sonner**                                       | React Hot Toast                |

---

## Architecture Overview

```
src/
├── app/
│   ├── (auth)/                    # Public auth pages (no sidebar)
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── verify-email/
│   │   ├── recover-account/
│   │   └── invite/[token]/
│   ├── (dashboard)/               # Authenticated pages (with sidebar)
│   │   ├── dashboard/             # Main dashboard / analytics overview
│   │   ├── profile/               # User's own profile
│   │   ├── settings/              # User settings (password, 2FA, notifications)
│   │   ├── sessions/              # Active sessions & security
│   │   ├── api-keys/              # User's API keys
│   │   └── admin/                 # Admin-only pages
│   │       ├── users/
│   │       ├── roles/
│   │       ├── permissions/
│   │       ├── groups/
│   │       ├── invitations/
│   │       ├── audit-logs/
│   │       ├── analytics/
│   │       ├── system-config/
│   │       └── social-connectors/
│   └── auth/
│       └── callback/              # OAuth callback handler
├── components/
│   ├── ui/                        # ui base components
│   ├── layout/                    # AppShell, Sidebar, Topbar, Breadcrumbs
│   ├── data-table/                # Reusable table with pagination, search, filters
│   ├── forms/                     # Reusable form components
│   └── charts/                    # Dashboard chart components
├── hooks/                         # useAuth, usePermissions, usePagination
├── lib/
│   ├── api/                       # API client, interceptors, endpoints
│   ├── auth/                      # Token management, refresh logic
│   └── utils/                     # Formatters, validators, helpers
├── stores/                        # Zustand stores (auth, ui)
└── types/                         # TypeScript interfaces for all models
```

---

## Shared Components (Build First)

Before sprints, build these **reusable components**:

| Component          | Description                                              | Used By                           |
| ------------------ | -------------------------------------------------------- | --------------------------------- |
| `<AppShell>`       | Layout with sidebar + topbar + content area              | All dashboard pages               |
| `<Sidebar>`        | Collapsible nav with role-based menu items               | All dashboard pages               |
| `<Topbar>`         | User avatar, notifications, quick actions                | All dashboard pages               |
| `<Breadcrumbs>`    | Auto-generated from route                                | All pages                         |
| `<DataTable>`      | Server-side paginated table with search, sort, filters   | Users, Audit, Groups, Invitations |
| `<Pagination>`     | Page controls (prev/next, page numbers, per-page select) | All list pages                    |
| `<SearchInput>`    | Debounced search input                                   | All list pages                    |
| `<StatusBadge>`    | Colored badge for status (active, suspended, etc.)       | Users, Invitations                |
| `<RoleBadge>`      | Colored chip for role names                              | Users, Groups                     |
| `<ConfirmDialog>`  | "Are you sure?" modal                                    | Delete, Suspend, Revoke actions   |
| `<EmptyState>`     | Illustration + message when no data                      | All list pages                    |
| `<LoadingSpinner>` | Skeleton loaders and spinners                            | All pages                         |
| `<FormField>`      | Label + Input + Error message wrapper                    | All forms                         |
| `<PermissionGate>` | Conditionally render based on user permissions           | Throughout admin                  |
| `<StatCard>`       | Number + label + icon + trend indicator                  | Dashboard                         |

---

## Sprint 1 — Project Setup & Auth Foundation

**Duration:** 3-4 days

### Goals

- Project scaffolding (React vite Ts + Tailwind )
- API client with JWT interceptor (auto-refresh on 401)
- Auth store (Zustand) — login state, user profile, permissions
- Route guards (redirect to login if unauthenticated)

### Screens

#### 1.1 Login Page (`/login`)

```
┌─────────────────────────────────┐
│           App Logo              │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Email                     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Password            👁    │  │
│  └───────────────────────────┘  │
│  ☐ Remember me                  │
│                                 │
│  [        Sign In         ]     │
│                                 │
│  ── or continue with ──         │
│  [Google] [GitHub] [Microsoft]  │
│                                 │
│  Forgot password?    Register   │
└─────────────────────────────────┘
```

**API Calls:**

- `POST /api/v1/auth/login` → store tokens
- `GET /api/v1/auth/social/providers` → show enabled social buttons
- `GET /api/v1/auth/social/:provider` → redirect to OAuth

**Components:** `LoginForm`, `SocialLoginButtons`, `PasswordInput`

#### 1.2 Register Page (`/register`)

```
┌─────────────────────────────────┐
│           App Logo              │
│                                 │
│  ┌──────────┐ ┌──────────────┐  │
│  │First Name│ │ Last Name    │  │
│  └──────────┘ └──────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Email                     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Password            👁    │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Confirm Password    👁    │  │
│  └───────────────────────────┘  │
│  Password strength: ████░░ Good │
│                                 │
│  [       Create Account      ]  │
│                                 │
│  Already have an account? Login │
└─────────────────────────────────┘
```

**API Calls:**

- `POST /api/v1/auth/register`

**Components:** `RegisterForm`, `PasswordStrengthMeter`

#### 1.3 Email Verification Page (`/verify-email?token=xxx`)

```
┌─────────────────────────────────┐
│           ✉ Icon                │
│                                 │
│    Verifying your email...      │
│    [Loading Spinner]            │
│                                 │
│    ── or on success ──          │
│                                 │
│    ✓ Email Verified!            │
│    [   Go to Login   ]         │
│                                 │
│    ── or on failure ──          │
│                                 │
│    ✕ Invalid or expired token   │
│    [  Resend Verification  ]    │
└─────────────────────────────────┘
```

**API Calls:**

- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`

### Technical Tasks

- [ ] Init React TS vite latest with react router dom
- [ ] Install & configure Tailwind
- [ ] Create API client (`lib/api/client.ts`) with Axios interceptors
- [ ] Implement token refresh logic (intercept 401 → call `/auth/refresh`)
- [ ] Create auth store (Zustand) with `login()`, `logout()`, `refreshToken()`
- [ ] Create `<AuthLayout>` for public pages (centered card)
- [ ] Create route middleware (redirect to `/login` if no token)
- [ ] Build Login, Register, Verify Email pages

---

## Sprint 2 — Password Recovery & Invitation Registration

**Duration:** 2-3 days

### Screens

#### 2.1 Forgot Password (`/forgot-password`)

```
┌─────────────────────────────────┐
│        Forgot Password?         │
│  Enter your email to receive    │
│  a reset link.                  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Email                     │  │
│  └───────────────────────────┘  │
│                                 │
│  [    Send Reset Link      ]    │
│                                 │
│  Back to Login                  │
└─────────────────────────────────┘
```

**API:** `POST /api/v1/auth/forgot-password`

#### 2.2 Reset Password (`/reset-password?token=xxx`)

```
┌─────────────────────────────────┐
│        Set New Password         │
│                                 │
│  ┌───────────────────────────┐  │
│  │ New Password         👁   │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Confirm Password     👁   │  │
│  └───────────────────────────┘  │
│  Password strength: ██████ Strong│
│                                 │
│  [    Reset Password       ]    │
└─────────────────────────────────┘
```

**API:** `POST /api/v1/auth/reset-password`

#### 2.3 Invitation Registration (`/invite/[token]`)

```
┌─────────────────────────────────┐
│  You've been invited to join!   │
│  Invited as: Moderator          │
│  Email: user@example.com        │
│                                 │
│  ┌──────────┐ ┌──────────────┐  │
│  │First Name│ │ Last Name    │  │
│  └──────────┘ └──────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Password            👁    │  │
│  └───────────────────────────┘  │
│                                 │
│  [    Accept & Register    ]    │
└─────────────────────────────────┘
```

**API Calls:**

- `GET /api/v1/invitations/validate/:token` → show invite details
- `POST /api/v1/auth/register` → register with invitation context

#### 2.4 Account Recovery (`/recover-account`)

**API Calls:**

- `POST /api/v1/auth/recover-account`
- `POST /api/v1/auth/recover-account/confirm`

#### 2.5 OAuth Callback Handler (`/auth/callback`)

- Silent page that reads `access_token` & `refresh_token` from URL params
- Stores tokens → redirects to dashboard
- Handles `error` param → shows error toast → redirects to login

---

## Sprint 3 — App Shell & Dashboard Layout

**Duration:** 3-4 days

### Screens

#### 3.1 App Shell (Layout)

```
┌────────────────────────────────────────────────────────┐
│ [≡]  App Name              🔍 Search    🔔  👤 Admin ▾│
├──────────┬─────────────────────────────────────────────┤
│          │                                             │
│ Dashboard│  Breadcrumbs: Dashboard                     │
│          │  ─────────────────────────────────────────  │
│ Users    │                                             │
│ Roles    │  [Page Content Area]                        │
│ Groups   │                                             │
│ ──────── │                                             │
│ Analytics│                                             │
│ Audit    │                                             │
│ ──────── │                                             │
│ Settings │                                             │
│ Social   │                                             │
│ Invites  │                                             │
│ ──────── │                                             │
│ My Profile│                                            │
│ Sessions │                                             │
│ API Keys │                                             │
│          │                                             │
│ [Logout] │                                             │
└──────────┴─────────────────────────────────────────────┘
```

**Sidebar Menu Structure (permission-gated):**

```
── Main ──
  📊 Dashboard          (always visible)

── Administration ──    (admin only)
  👥 Users              (user:read)
  🔐 Roles              (role:read)
  📋 Permissions        (permission:read)
  👥 Groups             (group:read)

── Monitoring ──        (admin only)
  📈 Analytics          (analytics:read)
  📝 Audit Logs         (audit:read)

── Configuration ──     (admin only)
  ⚙️  System Settings   (settings:read)
  🔗 Social Connectors  (settings:read)
  ✉️  Invitations       (user:read)

── My Account ──
  👤 Profile            (user:read)
  🔒 Security           (session:read)
  🗝  API Keys           (user:read)
```

#### 3.2 Dashboard Overview (`/dashboard`)

```
┌─────────────────────────────────────────────────┐
│  Welcome back, Admin!                           │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────┐│
│  │Total Users│ │  Active  │ │  New     │ │Sess.││
│  │    247    │ │   189    │ │  +23     │ │ 45  ││
│  │  ↑ 12%   │ │  ↑ 5%   │ │ this week│ │live ││
│  └──────────┘ └──────────┘ └──────────┘ └─────┘│
│                                                 │
│  ┌──────────────────────┐ ┌────────────────────┐│
│  │ User Growth (30 days)│ │ Users by Status    ││
│  │  📈 Line Chart       │ │  🍩 Donut Chart    ││
│  │                      │ │                    ││
│  │                      │ │  ● Active    189   ││
│  │                      │ │  ● Pending    34   ││
│  │                      │ │  ● Suspended  12   ││
│  │                      │ │  ● Inactive   12   ││
│  └──────────────────────┘ └────────────────────┘│
│                                                 │
│  ┌──────────────────────┐ ┌────────────────────┐│
│  │ Login Activity       │ │ Role Distribution  ││
│  │  📊 Bar Chart        │ │  📊 Bar Chart      ││
│  │  ■ Success  □ Failed │ │                    ││
│  └──────────────────────┘ └────────────────────┘│
│                                                 │
│  ┌──────────────────────────────────────────────┐│
│  │ Recent Audit Activity           [View All →] ││
│  │ ─────────────────────────────────────────── ││
│  │ Admin created user john@...     2 min ago   ││
│  │ Admin assigned role to user...  5 min ago   ││
│  │ User changed password           1 hour ago  ││
│  └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

**API Calls:**

- `GET /api/v1/admin/analytics/overview`
- `GET /api/v1/admin/analytics/users/chart?days=30`
- `GET /api/v1/admin/analytics/users/status`
- `GET /api/v1/admin/analytics/logins?days=30`
- `GET /api/v1/admin/analytics/roles`
- `GET /api/v1/admin/audit-logs?page=1&limit=5`

**Components:** `StatCard`, `UserGrowthChart`, `StatusDonutChart`, `LoginActivityChart`, `RoleDistributionChart`, `RecentAuditTable`

### Technical Tasks

- [ ] Build `<AppShell>` with responsive sidebar (collapsible on mobile)
- [ ] Build `<Sidebar>` with permission-gated menu items
- [ ] Build `<Topbar>` with user dropdown, search
- [ ] Build `<Breadcrumbs>` auto-generated from pathname
- [ ] Fetch user profile + permissions on login → store in Zustand
- [ ] Create `usePermissions()` hook → `can('user:read')`, `canAny(...)`, `canAll(...)`
- [ ] Create `<PermissionGate permission="user:read">` wrapper component
- [ ] Build Dashboard page with stat cards and charts

---

## Sprint 4 — User Profile & Account Settings

**Duration:** 3-4 days

### Screens

#### 4.1 My Profile (`/profile`)

```
┌─────────────────────────────────────────────┐
│  My Profile                                 │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ [Avatar]  Upload / Remove               ││
│  │                                         ││
│  │ First Name:  [Jonathan        ]         ││
│  │ Last Name:   [Doe             ]         ││
│  │ Email:       jonathan@test.com [Change] ││
│  │ Phone:       [+1234567890     ]         ││
│  │                                         ││
│  │ [     Save Changes     ]                ││
│  └─────────────────────────────────────────┘│
│                                             │
│  Account Info                               │
│  ─────────────────────                      │
│  Status:     ● Active                       │
│  Role:       Super Admin                    │
│  Member Since: March 1, 2026                │
│  Last Login:   March 13, 2026 2:30 PM       │
└─────────────────────────────────────────────┘
```

**API Calls:**

- `GET /api/v1/user/profile`
- `PATCH /api/v1/user/profile`
- `PATCH /api/v1/user/email`
- `PATCH /api/v1/user/phone`
- `POST /api/v1/user/profile/avatar`
- `DELETE /api/v1/user/profile/avatar`

#### 4.2 Security Settings (`/settings`)

```
┌─────────────────────────────────────────────┐
│  Security Settings                          │
│                                             │
│  Tabs: [Password] [Two-Factor] [Notifs]     │
│  ═══════════════════════════════════════     │
│                                             │
│  ── Password Tab ──                         │
│  ┌─────────────────────────────────────────┐│
│  │ Current Password:  [                  ] ││
│  │ New Password:      [                  ] ││
│  │ Confirm Password:  [                  ] ││
│  │ Strength: ██████ Strong                 ││
│  │                                         ││
│  │ [    Change Password    ]               ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ── Two-Factor Tab ──                       │
│  ┌─────────────────────────────────────────┐│
│  │ Status: 🔴 Disabled                     ││
│  │                                         ││
│  │ [   Enable 2FA   ]                      ││
│  │                                         ││
│  │ ── When enabled: ──                     ││
│  │ 1. Scan QR code with authenticator app  ││
│  │ 2. Enter 6-digit code to verify         ││
│  │ [QR Code Image]                         ││
│  │ Code: [______]                          ││
│  │ [  Verify & Activate  ]                 ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ── Notifications Tab ──                    │
│  ┌─────────────────────────────────────────┐│
│  │ ☐ Email me on new login                 ││
│  │ ☑ Email me on password change           ││
│  │ ☑ Email me on security alerts           ││
│  │                                         ││
│  │ [   Save Preferences   ]               ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ── Danger Zone ──                          │
│  ┌─────────────────────────────────────────┐│
│  │ Export My Data     [Download JSON]      ││
│  │ Delete Account     [Delete Account] 🔴 ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

**API Calls:**

- `PATCH /api/v1/user/password`
- `POST /api/v1/auth/2fa/enable` → `POST /api/v1/auth/2fa/verify`
- `POST /api/v1/auth/2fa/disable`
- `PATCH /api/v1/user/notifications`
- `GET /api/v1/user/data-export`
- `DELETE /api/v1/user/account`

#### 4.3 Active Sessions (`/sessions`)

```
┌─────────────────────────────────────────────────────┐
│  Active Sessions         [Terminate All Others]     │
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ 🖥  Chrome on Windows 11        ★ Current      ││
│  │    IP: 192.168.1.100 • Mumbai, India           ││
│  │    Last active: Just now                        ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ 📱 Safari on iPhone                [Terminate]  ││
│  │    IP: 10.0.0.55 • Delhi, India                ││
│  │    Last active: 2 hours ago                     ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  Login History                     [View All →]     │
│  ─────────────────────────────────────────────      │
│  │ ✓ Success │ Chrome/Win │ 192.168.1.100 │ 2h ago││
│  │ ✕ Failed  │ Firefox    │ 45.33.12.1    │ 1d ago││
│  │ ✓ Success │ Mobile     │ 10.0.0.55     │ 2d ago││
│                                                     │
│  Security Events                   [View All →]     │
│  ─────────────────────────────────────────────      │
│  │ Password changed            │ 3 days ago        ││
│  │ 2FA enabled                 │ 1 week ago        ││
└─────────────────────────────────────────────────────┘
```

**API Calls:**

- `GET /api/v1/sessions`
- `DELETE /api/v1/sessions/:id`
- `DELETE /api/v1/sessions`
- `GET /api/v1/security/login-history`
- `GET /api/v1/security/events`

---

## Sprint 5 — Admin User Management

**Duration:** 4-5 days

### Screens

#### 5.1 Users List (`/admin/users`)

```
┌───────────────────────────────────────────────────────────────┐
│  Users                                    [+ Create User]     │
│                                                               │
│  🔍 [Search users...    ]  Status: [All ▾]  Role: [All ▾]    │
│                                                               │
│  ┌────┬──────────────┬────────────────┬────────┬──────┬──────┐│
│  │ ☐  │ Name         │ Email          │ Status │ Role │ Act  ││
│  ├────┼──────────────┼────────────────┼────────┼──────┼──────┤│
│  │ ☐  │ John Doe     │ john@test.com  │🟢Active│ Admin│ ⋯   ││
│  │ ☐  │ Jane Smith   │ jane@test.com  │🟡Pend. │ User │ ⋯   ││
│  │ ☐  │ Bob Wilson   │ bob@test.com   │🔴Susp. │ Mod  │ ⋯   ││
│  └────┴──────────────┴────────────────┴────────┴──────┴──────┘│
│                                                               │
│  Showing 1-20 of 247      [◀ 1  2  3  ... 13 ▶]  Per page [20▾]│
└───────────────────────────────────────────────────────────────┘
```

**Row action menu (⋯):** View, Edit, Assign Roles, Reset Password, Suspend, Soft Delete, Hard Delete

#### 5.2 User Detail / Edit (`/admin/users/[id]`)

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Users                                        │
│                                                         │
│  Tabs: [Profile] [Roles] [Sessions] [Activity]          │
│  ═══════════════════════════════════════════════         │
│                                                         │
│  ── Profile Tab ──                                      │
│  [Avatar]   John Doe                                    │
│             john@test.com • ● Active • Verified ✓       │
│             Member since: Mar 1, 2026                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ First Name:  [John           ]                  │    │
│  │ Last Name:   [Doe            ]                  │    │
│  │ Email:       [john@test.com  ]                  │    │
│  │ Phone:       [+1234567890    ]                  │    │
│  │ Status:      [Active ▾       ]                  │    │
│  │ Verified:    [☑]                                │    │
│  │                                                 │    │
│  │ [Save]  [Reset Password]  [Suspend] [Delete 🔴]│    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ── Roles Tab ──                                        │
│  Current: [Admin ✕] [Moderator ✕]                       │
│  Add Role: [Select role...  ▾]  [Assign]                │
│                                                         │
│  ── Sessions Tab ──                                     │
│  (user's active sessions list)                          │
│                                                         │
│  ── Activity Tab ──                                     │
│  (filtered audit logs for this user)                    │
└─────────────────────────────────────────────────────────┘
```

#### 5.3 Create User Modal/Page

```
┌─────────────────────────────────────┐
│  Create New User                    │
│                                     │
│  First Name*:  [                  ] │
│  Last Name:    [                  ] │
│  Email*:       [                  ] │
│  Password*:    [                  ] │
│  Phone:        [                  ] │
│  Status:       [Active ▾         ] │
│  Pre-verified: [☑]                 │
│  Roles:        [Select roles... ▾] │
│                                     │
│  [Cancel]         [Create User]     │
└─────────────────────────────────────┘
```

**API Calls:**

- `GET /api/v1/admin/users?page=1&limit=20&search=...&status=...`
- `GET /api/v1/admin/users/:id`
- `POST /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id/status`
- `PATCH /api/v1/admin/users/:id/suspend`
- `POST /api/v1/admin/users/:id/reset-password`
- `POST /api/v1/admin/users/:id/roles`
- `DELETE /api/v1/admin/users/:id/roles`
- `DELETE /api/v1/admin/users/:id/soft`
- `DELETE /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id/restore`
- `GET /api/v1/admin/users/export`

---

## Sprint 6 — Roles & Permissions Management

**Duration:** 3-4 days

### Screens

#### 6.1 Roles List (`/admin/roles`)

```
┌──────────────────────────────────────────────────────┐
│  Roles                              [+ Create Role]   │
│                                                       │
│  ┌──────────────┬──────────┬───────┬──────┬────────┐  │
│  │ Name         │ Slug     │ Users │ Perms│ Actions│  │
│  ├──────────────┼──────────┼───────┼──────┼────────┤  │
│  │ Super Admin  │super_admin│  2   │  28  │ 🔒     │  │
│  │ Admin        │ admin    │  5    │  24  │ Edit   │  │
│  │ Moderator    │moderator │  12   │  12  │ Edit   │  │
│  │ User         │ user     │  230  │   6  │ Edit ★ │  │
│  └──────────────┴──────────┴───────┴──────┴────────┘  │
│                                                       │
│  🔒 = System role (cannot delete)                     │
│  ★  = Default role (assigned to new users)            │
└──────────────────────────────────────────────────────┘
```

#### 6.2 Role Detail / Permissions Editor (`/admin/roles/[id]`)

```
┌────────────────────────────────────────────────────┐
│  Role: Admin                                       │
│  ──────────────                                    │
│  Name: [Admin          ]                           │
│  Slug: admin (read-only for system roles)          │
│  Description: [Full admin access        ]          │
│  ☐ Default role (for new users)                    │
│                                                    │
│  Permissions (24/28 selected)    [Select All]      │
│  ════════════════════════════                      │
│                                                    │
│  ── User Module ──                                 │
│  ☑ user:create  ☑ user:read  ☑ user:update  ☑ delete│
│                                                    │
│  ── Role Module ──                                 │
│  ☑ role:create  ☑ role:read  ☑ role:update  ☑ delete│
│                                                    │
│  ── Group Module ──                                │
│  ☑ group:create  ☑ group:read  ☑ group:update  ☑ del│
│                                                    │
│  ── Settings Module ──                             │
│  ☑ settings:read  ☐ settings:update               │
│                                                    │
│  ── Analytics Module ──                            │
│  ☑ analytics:read                                  │
│                                                    │
│  ... (more modules)                                │
│                                                    │
│  [Save Changes]                                    │
└────────────────────────────────────────────────────┘
```

#### 6.3 Permissions List (`/admin/permissions`)

```
┌───────────────────────────────────────────────────────┐
│  Permissions (28 total)                               │
│                                                       │
│  Group by: [Module ▾]                                 │
│                                                       │
│  ── user (4) ──────────────────────────────────       │
│  user:create  │ user:read  │ user:update │ user:delete│
│                                                       │
│  ── role (4) ──────────────────────────────────       │
│  role:create  │ role:read  │ role:update │ role:delete│
│                                                       │
│  ── session (2) ───────────────────────────────       │
│  session:read │ session:delete                        │
│  ...                                                  │
└───────────────────────────────────────────────────────┘
```

**API Calls:**

- `GET /api/v1/roles`
- `GET /api/v1/roles/:id`
- `POST /api/v1/roles`
- `PATCH /api/v1/roles/:id`
- `DELETE /api/v1/roles/:id`
- `POST /api/v1/roles/:id/permissions`
- `DELETE /api/v1/roles/:id/permissions`
- `GET /api/v1/permissions`

---

## Sprint 7 — Groups Management

**Duration:** 3 days

### Screens

#### 7.1 Groups List (`/admin/groups`)

```
┌────────────────────────────────────────────────────────┐
│  Groups                              [+ Create Group]   │
│                                                         │
│  🔍 [Search...]  Active: [All ▾]                        │
│                                                         │
│  ┌────────────────┬────────┬───────┬───────┬──────────┐ │
│  │ Name           │ Slug   │ Users │ Roles │ Status   │ │
│  ├────────────────┼────────┼───────┼───────┼──────────┤ │
│  │ Engineering    │ eng    │  15   │  2    │ 🟢 Active│ │
│  │ Marketing      │ mktg   │   8   │  1    │ 🟢 Active│ │
│  │ Contractors    │ contr. │   3   │  1    │ 🔴 Inact.│ │
│  └────────────────┴────────┴───────┴───────┴──────────┘ │
└────────────────────────────────────────────────────────┘
```

#### 7.2 Group Detail (`/admin/groups/[id]`)

```
┌───────────────────────────────────────────────┐
│  Engineering Team                              │
│  Tabs: [Details] [Members] [Roles] [Permissions]│
│  ══════════════════════════════════════════     │
│                                                │
│  ── Members Tab ──                             │
│  Members (15)                   [+ Add Users]  │
│  ┌────────────────────────────────────────────┐│
│  │ John Doe     │ john@test.com  │ [Remove]  ││
│  │ Jane Smith   │ jane@test.com  │ [Remove]  ││
│  └────────────────────────────────────────────┘│
│                                                │
│  ── Roles Tab ──                               │
│  Assigned Roles         [+ Assign Role]        │
│  [Admin ✕] [Moderator ✕]                      │
│                                                │
│  ── Permissions Tab ──                         │
│  Resolved Permissions (from all roles):        │
│  user:read, user:update, group:read, ...       │
└───────────────────────────────────────────────┘
```

**API Calls:**

- All 10 group endpoints

---

## Sprint 8 — Audit Logs Viewer

**Duration:** 3 days

### Screens

#### 8.1 Audit Logs (`/admin/audit-logs`)

```
┌─────────────────────────────────────────────────────────────┐
│  Audit Logs                [Export JSON] [Export CSV]        │
│                                                             │
│  Filters:                                                   │
│  [User ▾] [Action ▾] [Method ▾] [Date From] [Date To] [🔍]│
│                                                             │
│  ┌──────────┬────────────┬────────┬────────┬───────┬───────┐│
│  │ Time     │ User       │ Action │ Method │ Path  │ Status││
│  ├──────────┼────────────┼────────┼────────┼───────┼───────┤│
│  │ 2:30 PM  │ admin@...  │ create │ POST   │/users │ 201   ││
│  │ 2:28 PM  │ admin@...  │ update │ PATCH  │/roles │ 200   ││
│  │ 2:15 PM  │ john@...   │ login  │ POST   │/auth  │ 200   ││
│  └──────────┴────────────┴────────┴────────┴───────┴───────┘│
│                                                             │
│  ── Click row to expand ──                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ IP: 192.168.1.100  │  User Agent: Chrome/Win11         ││
│  │ Target: User 507f1f77...                                ││
│  │ Changes: { name: "John" → "Jonathan" }                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Action Summary (top bar or sidebar):                       │
│  POST: 45  │  PATCH: 23  │  DELETE: 5  │  Total: 73       │
└─────────────────────────────────────────────────────────────┘
```

**API Calls:**

- `GET /api/v1/admin/audit-logs?...` (with all filters)
- `GET /api/v1/admin/audit-logs/summary`
- `GET /api/v1/admin/audit-logs/:id`
- `GET /api/v1/admin/audit-logs/export/json`
- `GET /api/v1/admin/audit-logs/export/csv`

---

## Sprint 9 — Analytics Dashboard (Full)

**Duration:** 3-4 days

### Screens

#### 9.1 Analytics Page (`/admin/analytics`)

```
┌──────────────────────────────────────────────────────────┐
│  Analytics                  Period: [7d] [30d] [90d] [1y]│
│                                                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐ │
│  │Total Users│ │Active(30d)│ │ New (7d)  │ │ Sessions │ │
│  │   247     │ │   189     │ │    23     │ │    45    │ │
│  └───────────┘ └───────────┘ └───────────┘ └──────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  User Growth                                        ││
│  │  📈 Area Chart (cumulative + daily overlay)         ││
│  │  X: dates   Y: user count                           ││
│  │  [Daily ▾]  [Show cumulative ☑]                     ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────┐  ┌────────────────────────────┐│
│  │ Users by Status     │  │ Login Activity             ││
│  │ 🍩 Donut Chart      │  │ 📊 Stacked Bar Chart      ││
│  │                     │  │  ■ Success  □ Failed       ││
│  │  Active:    189     │  │                            ││
│  │  Pending:    34     │  │                            ││
│  │  Suspended:  12     │  │                            ││
│  │  Inactive:   12     │  │                            ││
│  └─────────────────────┘  └────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Role Distribution                                   ││
│  │  📊 Horizontal Bar Chart                             ││
│  │  User        ████████████████████████████ 230        ││
│  │  Moderator   ████████ 12                             ││
│  │  Admin       ███ 5                                   ││
│  │  Super Admin █ 2                                     ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

**API Calls:**

- All 8 analytics endpoints

---

## Sprint 10 — System Configuration

**Duration:** 2-3 days

### Screens

#### 10.1 System Settings (`/admin/system-config`)

```
┌────────────────────────────────────────────────────────┐
│  System Settings                                       │
│                                                        │
│  Tabs: [App] [Auth] [Email] [Security] [Custom]        │
│  ════════════════════════════════════════════           │
│                                                        │
│  ── App Settings Tab ──                                │
│  ┌────────────────────────────────────────────────────┐│
│  │ Site Name          [My Awesome App      ] ℹ       ││
│  │ Logo URL           [https://...         ] ℹ       ││
│  │ Support Email      [support@app.com     ] ℹ       ││
│  │ Maintenance Mode   [Toggle OFF ○        ] ℹ       ││
│  │                                                   ││
│  │ [   Save App Settings   ]                         ││
│  └────────────────────────────────────────────────────┘│
│                                                        │
│  ── Auth Settings Tab ──                               │
│  ┌────────────────────────────────────────────────────┐│
│  │ Access Token TTL     [15m              ] ℹ        ││
│  │ Refresh Token TTL    [7d               ] ℹ        ││
│  │ Min Password Length  [8                ] ℹ        ││
│  │ Max Login Attempts   [5                ] ℹ        ││
│  │ Lock Duration (min)  [30               ] ℹ        ││
│  │ Require Email Verify [Toggle ON ●      ] ℹ        ││
│  │                                                   ││
│  │ [   Save Auth Settings   ]                        ││
│  └────────────────────────────────────────────────────┘│
│                                                        │
│  [+ Add Custom Setting]                                │
└────────────────────────────────────────────────────────┘
```

**API Calls:**

- `GET /api/v1/admin/settings`
- `GET /api/v1/admin/settings/category/:cat`
- `PATCH /api/v1/admin/settings/key/:key`
- `PATCH /api/v1/admin/settings/category/:cat` (bulk save)
- `POST /api/v1/admin/settings`
- `DELETE /api/v1/admin/settings/key/:key`

---

## Sprint 11 — Invitations Management

**Duration:** 2-3 days

### Screens

#### 11.1 Invitations List (`/admin/invitations`)

```
┌──────────────────────────────────────────────────────────┐
│  Invitations                        [+ Send Invitation]   │
│                                                           │
│  Status: [All ▾] [Pending] [Accepted] [Expired] [Revoked]│
│                                                           │
│  ┌──────────────────┬────────┬────────┬───────┬─────────┐ │
│  │ Email            │ Role   │ Status │ Sent  │ Actions │ │
│  ├──────────────────┼────────┼────────┼───────┼─────────┤ │
│  │ new@test.com     │ User   │🟡Pend. │ 2d ago│ Resend/Revoke│
│  │ mod@test.com     │ Mod    │🟢Accep.│ 5d ago│ —       │ │
│  │ old@test.com     │ User   │🔴Expir.│ 14d   │ Resend  │ │
│  └──────────────────┴────────┴────────┴───────┴─────────┘ │
└──────────────────────────────────────────────────────────┘
```

#### 11.2 Send Invitation Modal

```
┌────────────────────────────────────┐
│  Send Invitation                   │
│                                    │
│  Email*:  [                      ] │
│  Role:    [Select role...      ▾] │
│                                    │
│  [Cancel]         [Send Invite]    │
└────────────────────────────────────┘
```

**API Calls:**

- All 6 invitation endpoints

---

## Sprint 12 — API Keys Management

**Duration:** 2 days

### Screens

#### 12.1 API Keys (`/api-keys`)

```
┌──────────────────────────────────────────────────────────┐
│  API Keys                           [+ Generate New Key]  │
│                                                           │
│  ⚠ API keys are shown only once on creation.             │
│                                                           │
│  ┌──────────────┬──────────┬───────────┬────────┬───────┐ │
│  │ Name         │ Prefix   │ Last Used │ Expires│ Status│ │
│  ├──────────────┼──────────┼───────────┼────────┼───────┤ │
│  │ CLI Tool     │ a1b2c3d4 │ 2h ago    │ Never  │🟢 Act.│ │
│  │ Read-Only    │ e5f6g7h8 │ Never     │ Dec 31 │🟢 Act.│ │
│  │ Old Key      │ i9j0k1l2 │ 30d ago   │ Passed │🔴 Rev.│ │
│  └──────────────┴──────────┴───────────┴────────┴───────┘ │
│                                                           │
│  ── After creation: ──                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🔑 Your new API key:                               │  │
│  │ ┌─────────────────────────────────────────────────┐ │  │
│  │ │ a1b2c3d4e5f6...full64chars...            📋    │ │  │
│  │ └─────────────────────────────────────────────────┘ │  │
│  │ ⚠ Copy this key now. It won't be shown again.     │  │
│  │ [  Done  ]                                         │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**API Calls:**

- All 5 API key endpoints

---

## Sprint 13 — Social Connectors Admin

**Duration:** 3 days

### Screens

#### 13.1 Social Connectors (`/admin/social-connectors`)

```
┌─────────────────────────────────────────────────────────┐
│  Social Login Connectors           [+ Add Connector]     │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🔵 Google          client_id: 1234...****6789      │ │
│  │    Scopes: email, profile, openid                   │ │
│  │    [Enabled ●]                     [Edit] [Delete]  │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ ⚫ GitHub          client_id: abc1...****ef90       │ │
│  │    Scopes: user:email, read:user                    │ │
│  │    [Enabled ●]                     [Edit] [Delete]  │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ 🔵 Facebook        client_id: 9876...****1234      │ │
│  │    Scopes: email, public_profile                    │ │
│  │    [Disabled ○]                    [Edit] [Delete]  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### 13.2 Add/Edit Connector Modal

```
┌──────────────────────────────────────────┐
│  Add Social Connector                    │
│                                          │
│  Provider*:    [Google           ▾]      │
│  Display Name: [Sign in with Google ]    │
│  Client ID*:   [                     ]   │
│  Client Secret*: [                   ]   │
│  Scopes:       [email, profile       ]   │
│  Enabled:      [Toggle ●            ]    │
│  Sort Order:   [1                    ]   │
│  Icon URL:     [                     ]   │
│                                          │
│  ── Advanced (auto-filled for known providers) ──│
│  Authorize URL: [https://accounts.go...]│
│  Token URL:     [https://oauth2.goog...]│
│  Profile URL:   [https://www.googlea...]│
│  Callback URL:  [                     ] │
│                                          │
│  [Cancel]              [Save Connector]  │
└──────────────────────────────────────────┘
```

**API Calls:**

- All 6 social connector admin endpoints

---

## Sprint 14 — Social Account Linking (User Side)

**Duration:** 2 days

### Screens

#### 14.1 Linked Accounts (in Profile/Settings)

```
┌──────────────────────────────────────────────┐
│  Linked Social Accounts                      │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ 🔵 Google     john@gmail.com             ││
│  │    Linked on Mar 10, 2026  [Unlink]      ││
│  ├──────────────────────────────────────────┤│
│  │ ⚫ GitHub     johndoe                    ││
│  │    Linked on Mar 5, 2026   [Unlink]      ││
│  └──────────────────────────────────────────┘│
│                                              │
│  Available to Link:                          │
│  [🔵 Link Facebook]  [🔵 Link Microsoft]    │
└──────────────────────────────────────────────┘
```

**API Calls:**

- `GET /api/v1/auth/social/accounts/linked`
- `GET /api/v1/auth/social/:provider/link` → redirect flow
- `DELETE /api/v1/auth/social/:provider/unlink`

---

## Sprint 15 — Polish, Responsive & Dark Mode

**Duration:** 3-4 days

### Tasks

- [ ] **Responsive design** — Mobile sidebar drawer, stacked tables, touch-friendly
- [ ] **Dark mode** — Toggle in topbar, persist preference in localStorage
- [ ] **Loading states** — Skeleton loaders for all data-driven pages
- [ ] **Empty states** — Illustrations + CTAs when lists are empty
- [ ] **Error boundaries** — Graceful error pages (404, 500, 403)
- [ ] **Toast notifications** — Success/error toasts for all mutations
- [ ] **Keyboard shortcuts** — `Ctrl+K` for search, `Esc` to close modals
- [ ] **Breadcrumbs** — Dynamic breadcrumbs on all pages
- [ ] **Table column resize/hide** — User preference for table columns
- [ ] **Bulk actions** — Select multiple users → bulk suspend/delete/assign role

### Screen Wireframes

#### Mobile Sidebar

```
┌──────────────┐
│ ≡  App Name  │
├──────────────┤
│ [Full-width  │
│  navigation  │
│  slides in   │
│  from left]  │
│              │
│ Dashboard    │
│ Users        │
│ Roles        │
│ ...          │
│              │
│ [Logout]     │
└──────────────┘
```

#### 404 Page

```
┌─────────────────────────────┐
│                             │
│        🔍                   │
│   Page Not Found            │
│   The page you're looking   │
│   for doesn't exist.        │
│                             │
│   [Back to Dashboard]       │
└─────────────────────────────┘
```

#### 403 Forbidden

```
┌─────────────────────────────┐
│                             │
│        🔒                   │
│   Access Denied             │
│   You don't have permission │
│   to view this page.        │
│                             │
│   [Back to Dashboard]       │
└─────────────────────────────┘
```

---

## Sprint 16 — Testing, Optimization & Deployment

**Duration:** 3-4 days

### Tasks

- [ ] **E2E tests** — Playwright or Cypress for critical flows (login, register, admin CRUD)
- [ ] **Component tests** — Vitest + Testing Library for key components
- [ ] **Performance** — Lazy load routes, optimize bundle size, image optimization
- [ ] **SEO** — Meta tags, OpenGraph for public pages
- [ ] **PWA** — Service worker, offline support (optional)
- [ ] **CI/CD** — GitHub Actions: lint → test → build → deploy
- [ ] **Docker** — Multi-stage Dockerfile for frontend
- [ ] **Environment config** — `.env` for API URL, app name, feature flags

---

## Sprint Timeline Summary

| Sprint | Name                  | Duration | Key Deliverables                                           |
| ------ | --------------------- | -------- | ---------------------------------------------------------- |
| 1      | Auth Foundation       | 3-4 days | Login, Register, Verify Email, API client                  |
| 2      | Password & Invites    | 2-3 days | Forgot/Reset Password, Invite Registration, OAuth Callback |
| 3      | App Shell & Dashboard | 3-4 days | Layout, Sidebar, Dashboard with Charts                     |
| 4      | Profile & Settings    | 3-4 days | Profile Edit, Password, 2FA, Notifications, Sessions       |
| 5      | Admin Users           | 4-5 days | User List, Detail, Create, Edit, Roles, Delete             |
| 6      | Roles & Permissions   | 3-4 days | Role CRUD, Permission Matrix, Assignment                   |
| 7      | Groups                | 3 days   | Group CRUD, Members, Role Assignment                       |
| 8      | Audit Logs            | 3 days   | Log Viewer, Filters, Export                                |
| 9      | Analytics             | 3-4 days | Full Analytics Page, All Charts                            |
| 10     | System Config         | 2-3 days | Settings Editor by Category                                |
| 11     | Invitations           | 2-3 days | Invite CRUD, Status Filter                                 |
| 12     | API Keys              | 2 days   | Key Generation, Copy, Revoke                               |
| 13     | Social Connectors     | 3 days   | Connector Admin CRUD                                       |
| 14     | Social Linking        | 2 days   | Link/Unlink Social Accounts                                |
| 15     | Polish                | 3-4 days | Responsive, Dark Mode, Loading, Errors                     |
| 16     | Testing & Deploy      | 3-4 days | E2E Tests, Performance, CI/CD                              |

**Total Estimated Duration: 42-54 days (~8-10 weeks)**

---

## API Endpoints → Screen Mapping

| Screen            | Endpoints Used                                                                  |
| ----------------- | ------------------------------------------------------------------------------- |
| Login             | `POST /auth/login`, `GET /auth/social/providers`                                |
| Register          | `POST /auth/register`                                                           |
| Verify Email      | `POST /auth/verify-email`, `POST /auth/resend-verification`                     |
| Forgot Password   | `POST /auth/forgot-password`                                                    |
| Reset Password    | `POST /auth/reset-password`                                                     |
| Invite Register   | `GET /invitations/validate/:token`, `POST /auth/register`                       |
| OAuth Callback    | `GET /auth/social/:provider/callback`                                           |
| Dashboard         | `GET /analytics/overview`, `/users/chart`, `/users/status`, `/logins`, `/roles` |
| My Profile        | `GET /user/profile`, `PATCH /user/profile`, `/email`, `/phone`, `POST /avatar`  |
| Security Settings | `PATCH /user/password`, `POST /2fa/enable`, `/2fa/verify`, `/2fa/disable`       |
| Notifications     | `PATCH /user/notifications`                                                     |
| GDPR              | `GET /user/data-export`, `DELETE /user/account`                                 |
| Sessions          | `GET /sessions`, `DELETE /sessions/:id`, `DELETE /sessions`                     |
| Login History     | `GET /security/login-history`                                                   |
| Security Events   | `GET /security/events`                                                          |
| Admin Users List  | `GET /admin/users`                                                              |
| Admin User Detail | `GET /admin/users/:id`, `PATCH`, `POST /roles`, etc.                            |
| Admin Create User | `POST /admin/users`                                                             |
| Roles List        | `GET /roles`                                                                    |
| Role Detail       | `GET /roles/:id`, `PATCH`, `POST /permissions`, etc.                            |
| Permissions       | `GET /permissions`                                                              |
| Groups List       | `GET /admin/groups`                                                             |
| Group Detail      | `GET /admin/groups/:id`, all sub-endpoints                                      |
| Audit Logs        | `GET /admin/audit-logs`, `/summary`, `/export/*`                                |
| Analytics         | All 8 analytics endpoints                                                       |
| System Config     | `GET /admin/settings`, `/category/:cat`, `PATCH`, etc.                          |
| Invitations       | `GET /admin/invitations`, `POST`, `DELETE`, etc.                                |
| API Keys          | `GET /user/api-keys`, `POST`, `DELETE`, etc.                                    |
| Social Connectors | `GET /admin/social-connectors`, `POST`, `PATCH`, etc.                           |
| Linked Accounts   | `GET /auth/social/accounts/linked`, `DELETE /unlink`                            |

---

## Key TypeScript Interfaces (for Frontend)

```typescript
// User
interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'locked';
  is_verified: boolean;
  is_2fa_enabled: boolean;
  roles: Role[];
  notification_preferences: NotificationPreferences;
  last_login_at?: string;
  created_at: string;
}

// Role
interface Role {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: Permission[];
  is_default: boolean;
  is_system: boolean;
}

// Permission
interface Permission {
  _id: string;
  name: string;
  slug: string;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

// Group
interface UserGroup {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  roles: Role[];
  users: User[];
  is_active: boolean;
}

// Session
interface Session {
  _id: string;
  device: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

// AuditLog
interface AuditLog {
  _id: string;
  user_id: string;
  user_email: string;
  action: string;
  target_type: string;
  target_id?: string;
  method: string;
  endpoint: string;
  status_code: number;
  ip_address: string;
  created_at: string;
}

// Invitation
interface Invitation {
  _id: string;
  email: string;
  role_id?: Role;
  token: string;
  expires_at: string;
  accepted_at?: string;
  invited_by: User;
  is_revoked: boolean;
}

// ApiKey
interface ApiKey {
  _id: string;
  name: string;
  prefix: string;
  permissions: string[];
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

// SystemConfig
interface SystemConfig {
  _id: string;
  key: string;
  value: any;
  category: string;
  description?: string;
}

// SocialConnector
interface SocialConnector {
  _id: string;
  provider: string;
  display_name: string;
  client_id: string;
  client_secret_masked: string;
  scopes: string[];
  is_enabled: boolean;
  sort_order: number;
  icon_url?: string;
}

// SocialAccount
interface SocialAccount {
  _id: string;
  provider: string;
  provider_user_id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  linked_at: string;
}

// Paginated Response
interface PaginatedResponse<T> {
  data: T[];
  meta_data: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// API Response Wrapper
interface ApiResponse<T> {
  success: boolean;
  code: number;
  data: T;
  description?: string;
}

// Error Response
interface ApiError {
  success: false;
  code: number;
  error: string;
  error_description: string;
}

// Auth Tokens
interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
}

// Notification Preferences
interface NotificationPreferences {
  email_on_login: boolean;
  email_on_password_change: boolean;
  email_on_security_alert: boolean;
}
```

---

> **Ready to build!** Start with Sprint 1 and progress sequentially. Each sprint builds on the previous one.
