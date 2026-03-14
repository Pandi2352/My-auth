# NestJS + MongoDB User Management System

A production-ready, full-stack user management boilerplate built with **NestJS 11**, **MongoDB/Mongoose 9**, and a **React 19 + Vite** admin dashboard. Designed as a reusable foundation for any application that needs authentication, authorization, and user administration out of the box.

## Features

### Authentication & Security
- **Email/password authentication** with JWT (access + refresh tokens)
- **Email verification** flow with token-based confirmation
- **Email change** with password confirmation and re-verification
- **Forgot/reset password** with secure token expiry
- **Two-Factor Authentication (2FA)** — full frontend UI: enable with QR code, verify TOTP, disable with code
- **Account lockout** after configurable failed login attempts
- **Account recovery** — recover soft-deleted accounts via email token
- **Session management** with device tracking, IP logging, and location detection
- **Login history** — paginated list of all sign-in attempts (success/fail, device, IP, location)
- **Security events timeline** — password changes, 2FA toggles, admin impersonation log
- **Google reCAPTCHA v2** integration on login, register, and forgot-password
- **IP whitelisting/blacklisting** — admin-configurable via system settings
- **Rate limiting** via `@nestjs/throttler`
- **Admin impersonation** — impersonate any user with a banner, short-lived token, and one-click exit
- **Idle session timeout** — warning modal + auto-logout after inactivity
- **Cookie consent banner** (GDPR)

### Social Login (OAuth2)
- Social connector CRUD (Google, GitHub, Microsoft, Facebook, Apple, Twitter, LinkedIn, Custom)
- Admin toggle to enable/disable providers per-connector
- Dynamic social login buttons on the login page (fetches enabled providers)
- Full OAuth2 callback flow — auto-creates user, issues JWT, redirects to dashboard
- **Linked social accounts UI** — view/unlink social accounts on the Security page
- Custom provider support with manual OAuth URL configuration
- Advanced settings: authorize URL, token URL, profile URL, callback URL, icon URL

### User Management (Admin)
- Full CRUD for users, roles, permissions, and groups
- Role-based access control (RBAC) with granular permissions (`module:action` format)
- **Roles fetched from API** in user forms (not hardcoded) with checkbox selection by role ID
- **Custom user fields** — admin-defined extra profile fields (text, number, date, select, multiselect, boolean, URL, email) with dynamic form rendering
- User invitations with email delivery and token validation
- Soft/hard delete with account recovery (30-day window)
- Bulk role assignment, status management (active, pending, suspended, locked)

### API Key Management
- User-scoped API keys with prefix display, scope permissions, and expiry
- One-time secret display with copy-to-clipboard
- Revoke individual keys or manage via dashboard

### Audit & Analytics
- Comprehensive audit logging (action, method, endpoint, status code, IP, user agent)
- **Analytics dashboard** — user growth (area chart), login activity (stacked bar: success/fail), role distribution (donut chart), status breakdown, period selector (7/30/90 days)
- Export analytics as JSON, export audit logs as JSON or CSV

### Advertisement System
- Full CRUD for advertisements with admin page
- **3 ad types**: Image banner (with click URL), HTML content, Ad script (AdSense, Media.net, etc.)
- **6 placement positions**: header, sidebar, content_top, content_bottom, footer, popup
- Schedule with start/end dates, priority ordering, target page filtering
- Built-in impression and click tracking with CTR display
- Reusable `<AdBanner position="header" />` component for any layout
- Stats cards: total ads, impressions, clicks

### System Configuration
- Key-value settings organized by category: **App**, **Auth**, **Email**, **Security**
- **App**: site name, logo URL, support email, maintenance mode, announcement banner (message, type, dismissible)
- **Auth**: token TTL, password min length, max login attempts, lock duration, require email verification
- **Email**: SMTP host, port, from address, from name
- **Security**: rate limit TTL/max, session timeout, IP whitelist/blacklist
- **Advanced tab**: raw key-value editor for all settings with inline edit
- All values pre-populated from database on load
- **Dynamic branding** — site name and logo URL reflected in sidebar, auth pages, and browser title

### Announcement Banner
- Admin-configurable site-wide message bar at the top of the dashboard
- **4 styles**: info (blue), warning (amber), success (green), error (red)
- Optional dismissible (per-session via sessionStorage)
- Managed via Settings → General tab

### In-App Notifications (Real-time)
- **WebSocket gateway** (Socket.IO) with JWT-authenticated connections
- Per-user notification delivery with room-based targeting
- **Bell icon** in topbar with unread count badge (real-time updates)
- Dropdown panel with color-coded notifications (info/success/warning/error)
- Mark as read (single or all), click to navigate, relative timestamps
- REST API: list, unread count, mark read, delete
- Broadcast support for system-wide notifications

### Email Notifications
- Transactional emails: verification, welcome, password reset, login alerts, security alerts, account locked, account recovery
- Per-user notification preferences (login alerts, password change, security alerts)
- Toggle switches on profile page with instant save
- Preference-aware sending — respects user opt-out

### Custom Fields
- Admin-defined extra user profile fields via `/custom-fields` page
- **8 field types**: text, number, date, select (dropdown), multiselect (tag chips), boolean (checkbox), URL, email
- Each field has: label, key, type, description, placeholder, required/optional, active/inactive, sort order, options (for select types)
- Values stored as `custom_fields` JSON object on each user document
- Dynamic `CustomFieldsForm` component renders fields automatically on Profile page and admin User Detail page
- Fields only appear when at least one active custom field is defined

### Structured Logging
- **Winston** logger with colored console output (dev) and JSON file output (production)
- Log rotation: 10MB max file size, 5 error files, 10 combined files
- **Admin log viewer** (`/system-logs`) — read log files with level filtering, line count selector, expandable entries with stack traces
- Log file browser showing available files with sizes

### Frontend (React Admin Dashboard)
- **React 19** + **Vite 8** + **TypeScript** + **Tailwind CSS 4**
- **Zustand 5** for state management with persist middleware + hydration handling
- **React Hook Form** + **Zod** for form validation
- **Dark mode** with system preference detection
- **Lazy-loaded routes** with Suspense for code splitting
- **Command palette** (Cmd+K) with keyboard navigation and permission filtering
- **Breadcrumbs** auto-generated from routes
- **Grouped sidebar** with section labels (Main, Management, Security, System) and active left-border indicator
- **Password strength meter** (5-segment bar + criteria checklist) on all password forms
- **Session timeout** with idle detection and warning modal
- **Cookie consent banner** (GDPR)
- **Data export & account deletion** (GDPR compliance) on profile page
- **DataTable** with server-side + automatic client-side pagination, sorting, rich empty states with icons + action buttons
- **Modal/Dialog** system with portal rendering
- **Permission-based sidebar** and command palette filtering
- **Error pages**: 404, 403, 500, Network Error — all with consistent design (colored icon circles, action buttons)
- **Error boundary** with crash recovery UI
- **Impersonation banner** in topbar with one-click exit
- **Notification bell** with real-time WebSocket updates and unread badge
- **Announcement banner** — admin-configurable site-wide message bar
- **Favorites/pinned pages** — star any sidebar item, pinned section at top (localStorage-persisted)
- **Dynamic branding** — site name + logo from settings reflected everywhere (sidebar, auth pages, browser title)
- **Live activity feed** on dashboard with auto-polling (30s) and pause/resume

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, Node.js 20+ |
| Database | MongoDB with Mongoose 9 |
| Auth | Passport.js (JWT + Local), bcrypt, speakeasy (TOTP) |
| Frontend | React 19, Vite 8, TypeScript 5 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| State | Zustand 5 with persist middleware |
| Forms | React Hook Form + Zod |
| Charts | Recharts (Area, Bar, Pie, Line) |
| Real-time | Socket.IO (WebSocket gateway for notifications) |
| Logging | Winston (console + file with rotation) |
| HTTP | Axios with interceptors (auto-refresh, error handling) |
| Email | Nodemailer (SMTP) |
| API Docs | Swagger/OpenAPI via `@nestjs/swagger` |
| Containerization | Docker + docker-compose |

## Project Structure

```
nestjs-mongodb-setup-utils/
├── server/                        # NestJS backend
│   ├── src/
│   │   ├── common/                # Guards, decorators, enums, constants
│   │   │   └── guards/            # JWT, Roles, Permissions, CAPTCHA, IP Block
│   │   ├── config/                # Database, JWT configuration
│   │   ├── modules/
│   │   │   ├── admin/             # Admin user management
│   │   │   ├── advertisement/     # Ad management (CRUD + tracking)
│   │   │   ├── analytics/         # User & login analytics
│   │   │   ├── api-key/           # API key management
│   │   │   ├── audit/             # Audit logging & export
│   │   │   ├── auth/              # Authentication (login, register, 2FA, impersonate, recovery)
│   │   │   ├── captcha/           # reCAPTCHA verification service
│   │   │   ├── group/             # User groups
│   │   │   ├── health/            # Health check endpoints
│   │   │   ├── invitation/        # User invitations
│   │   │   ├── notification/      # Email notifications (preference-aware)
│   │   │   ├── permission/        # Permission CRUD
│   │   │   ├── role/              # Role CRUD with permission assignment
│   │   │   ├── seed/              # Database seeding (users, roles, permissions)
│   │   │   ├── session/           # Sessions, login history, security events
│   │   │   ├── social-auth/       # Social OAuth connectors + account linking
│   │   │   ├── custom-field/       # Admin-defined custom user profile fields
│   │   │   ├── in-app-notification/ # Real-time notifications (WebSocket + REST)
│   │   │   ├── system-config/     # System settings (key-value store by category)
│   │   │   └── user/              # User profile, avatar, email change, password, custom fields
│   │   └── utils/                 # Helpers (bcrypt, date, TOTP, IP location)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.development
│
├── client/                        # React frontend
│   ├── src/
│   │   ├── app/                   # Auth pages (login, register, forgot-password, recover-account, etc.)
│   │   ├── components/
│   │   │   ├── layout/            # Sidebar, Topbar (with impersonation banner), DashboardLayout, AuthLayout
│   │   │   ├── forms/             # UserForm, CustomFieldsForm (dynamic field rendering)
│   │   │   └── ui/                # Button, Input, Card, Modal, DataTable, Captcha, CommandPalette,
│   │   │                          # Breadcrumbs, PasswordStrengthMeter, CookieConsent, AdBanner,
│   │   │                          # IdleTimeoutWarning, SocialLoginButtons, NotificationBell,
│   │   │                          # AnnouncementBanner, etc.
│   │   ├── hooks/                 # useAuth, usePermissions, useTheme, useIdleTimeout, usePagination,
│   │   │                          # useFavorites, useAppSettings, useDebounce, etc.
│   │   ├── lib/                   # API client, endpoints, error handling, mapUser utility
│   │   ├── pages/
│   │   │   ├── dashboard/         # Analytics overview dashboard
│   │   │   ├── users/             # User list, create, detail (with impersonate button)
│   │   │   ├── roles/             # Role list, detail with permission matrix
│   │   │   ├── permissions/       # Permission inventory
│   │   │   ├── groups/            # Group list, detail with members/roles
│   │   │   ├── invitations/       # Invitation management
│   │   │   ├── sessions/          # Active sessions
│   │   │   ├── security/          # 2FA setup, linked accounts, login history, security events
│   │   │   ├── api-keys/          # API key management
│   │   │   ├── audit/             # Audit logs with search + export
│   │   │   ├── analytics/         # Charts: user growth, login activity, role distribution
│   │   │   ├── advertisements/    # Ad management (CRUD + stats)
│   │   │   ├── connectors/        # Social connector config (all OAuth fields)
│   │   │   ├── settings/          # System settings (App, Auth, Email, Security, Advanced)
│   │   │   ├── custom-fields/      # Custom field definitions (admin)
│   │   │   ├── system-logs/       # Winston log viewer (admin)
│   │   │   ├── profile/           # Profile, email change, password, notifications, custom fields, GDPR
│   │   │   └── errors/            # 404, 403, 500, Network Error
│   │   ├── stores/                # Zustand stores (auth with hydration)
│   │   └── types/                 # TypeScript type definitions
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** 20+
- **MongoDB** 6+ (local or Atlas)
- **npm** 9+

### 1. Clone the repository

```bash
git clone <repository-url>
cd nestjs-mongodb-setup-utils
```

### 2. Backend setup

```bash
cd server
cp .env.development .env
npm install
```

Edit `.env` with your configuration:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=nestjs_app
JWT_ACCESS_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-secret>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Start the backend:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1` and Swagger docs at `http://localhost:3000/api-docs`.

### 3. Frontend setup

```bash
cd client
npm install --legacy-peer-deps
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_RECAPTCHA_SITE_KEY=          # Optional: leave empty to disable CAPTCHA
```

Start the frontend:

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### 4. Seed development data

The server automatically seeds permissions and a dev user on startup:

- **Email:** `dev@example.com`
- **Password:** `DevPassword123!`
- **Role:** `super_admin` (full permissions)

### 5. Docker (optional)

```bash
cd server
docker-compose up -d
```

This starts MongoDB and the NestJS server in containers.

## Environment Variables

### Server

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | Database name | `nestjs_app` |
| `JWT_ACCESS_SECRET` | JWT access token secret | — |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `JWT_REFRESH_EXPIRES_IN_REMEMBER` | Refresh TTL (remember me) | `30d` |
| `SMTP_HOST` | SMTP server host | — |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `SMTP_FROM` | From email address | — |
| `BCRYPT_SALT_ROUND` | Bcrypt salt rounds | `10` |
| `RECAPTCHA_ENABLED` | Enable CAPTCHA verification | `false` |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA secret key | — |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `*` |
| `SWAGGER_ENABLED` | Enable Swagger docs | `true` |

### Client

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000/api/v1` |
| `VITE_RECAPTCHA_SITE_KEY` | Google reCAPTCHA site key (empty = disabled) | — |

## API Overview

| Module | Base Path | Auth | Description |
|--------|-----------|------|-------------|
| Auth | `/auth` | Public | Login, register, verify email, 2FA, password reset, account recovery, impersonation |
| Social Auth | `/auth/social` | Public + JWT | OAuth flow, linked accounts, link/unlink providers |
| User Profile | `/user` | JWT | Profile, avatar, email change, password, notifications, data export |
| Admin Users | `/admin/users` | JWT + Permission | User CRUD, status management, role assignment |
| Roles | `/roles` | JWT | Role CRUD with permission management |
| Permissions | `/permissions` | JWT | Permission CRUD |
| Groups | `/admin/groups` | JWT + Permission | Group CRUD with user/role assignment |
| Invitations | `/admin/invitations` | JWT + Permission | Invite users via email |
| Sessions | `/sessions` | JWT | View/terminate active sessions |
| Security | `/security` | JWT | Login history, security events |
| API Keys | `/user/api-keys` | JWT | Manage personal API keys |
| Audit Logs | `/admin/audit-logs` | JWT + Permission | View/export activity logs |
| Analytics | `/admin/analytics` | JWT + Permission | User stats, login metrics, charts |
| Advertisements | `/admin/advertisements` | JWT + Permission | Ad CRUD, toggle, tracking |
| Ads (Public) | `/ads` | Public | Fetch active ads, track impressions/clicks |
| Social Connectors | `/admin/social-connectors` | JWT + Permission | OAuth provider management |
| Custom Fields | `/admin/custom-fields` | JWT + Permission | Define extra user profile fields |
| Notifications | `/notifications` | JWT | In-app notifications (list, read, delete) |
| System Logs | `/admin/logs` | JWT + Permission | Read application log files |
| Settings | `/admin/settings` | JWT + Permission | System configuration by category |
| Health | `/health` | Public | Liveness and readiness checks |

## Permission System

Permissions follow `module:action` format:

```
user:create          user:read          user:update          user:delete
role:create          role:read          role:update          role:delete
group:create         group:read         group:update         group:delete
permission:create    permission:read    permission:update    permission:delete
session:read         session:delete
audit:read           analytics:read
invitation:create    invitation:read
connector:create     connector:read     connector:update     connector:delete
advertisement:create advertisement:read advertisement:update advertisement:delete
settings:read        settings:update
```

Permissions are assigned to roles, roles are assigned to users and groups. The frontend sidebar, command palette, and route guards automatically filter based on the current user's permissions.

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Stats cards, user growth chart, role distribution, recent activity |
| Users | `/users` | User list with search, pagination, create/view/delete |
| User Detail | `/users/:id` | Profile edit, role assignment, custom fields, sessions, activity tabs, impersonate button |
| Roles | `/roles` | Role list with permission count badges |
| Role Detail | `/roles/:id` | Permission matrix with module grouping |
| Permissions | `/permissions` | Permission inventory with module/action badges |
| Groups | `/groups` | Group list with member counts and role badges |
| Group Detail | `/groups/:id` | Members, roles, resolved permissions tabs |
| Invitations | `/invitations` | Send/resend/revoke invitations |
| Security | `/security` | 2FA setup, linked accounts, login history, security events timeline |
| Sessions | `/sessions` | Active sessions with terminate single/all |
| API Keys | `/api-keys` | Generate, view, revoke API keys |
| Audit Logs | `/audit-logs` | Searchable logs with detail modal, CSV/JSON export |
| Analytics | `/analytics` | User growth, login activity, role distribution charts with period selector |
| Advertisements | `/advertisements` | Ad CRUD with stats (impressions, clicks, CTR) |
| Connectors | `/connectors` | Social OAuth provider config with advanced URL settings |
| Custom Fields | `/custom-fields` | Define custom user profile fields (admin) |
| System Logs | `/system-logs` | Application log viewer with level filtering |
| Settings | `/settings` | App (with announcements), Auth, Email, Security tabs + advanced raw editor |
| Profile | `/profile` | Avatar, personal info, custom fields, email change, password, notifications, GDPR |
| Login | `/login` | Email/password + social login buttons + CAPTCHA |
| Register | `/register` | Registration with password strength meter + CAPTCHA |
| Forgot Password | `/forgot-password` | Password reset request + CAPTCHA |
| Reset Password | `/reset-password` | Set new password with strength meter |
| Recover Account | `/recover-account` | Request + confirm account recovery |

## License

MIT
