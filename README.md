# NestJS + MongoDB User Management System

A production-ready, full-stack user management boilerplate built with **NestJS 11**, **MongoDB/Mongoose 9**, and a **React 19 + Vite** admin dashboard. Designed as a reusable foundation for any application that needs authentication, authorization, and user administration out of the box.

## Features

### Authentication & Security
- **Email/password authentication** with JWT (access + refresh tokens)
- **Email verification** flow with token-based confirmation
- **Two-Factor Authentication (2FA)** — full frontend UI: enable with QR code, verify TOTP, disable with code
- **Administrative 2FA Reset** — powerful override to disable 2FA for users who lose device access
- **Account lockout** after configurable failed login attempts
- **Account recovery** — recover soft-deleted accounts via email token
- **Surgical Session Management** — device tracking, IP logging, and user-agent parsing (Browser/OS)
- **Remote Session Termination** — view active sessions and remotely log out individual devices or all sessions
- **Security events timeline** — password changes, 2FA toggles, admin impersonation log
- **Google reCAPTCHA v2** integration on login, register, and forgot-password
- **Admin impersonation** — impersonate any user with a banner, short-lived token, and one-click exit
- **WebAuthn (Passkeys)** — hardware-backed authentication (Yubikeys, FaceID, TouchID) with full registration, management and passwordless login flow

### Global Intelligence & Navigation
- **Command Palette (Cmd+K)** — keyboard-first navigation with permission-aware filtering
- **Dynamic API Searching** — real-time discovery of users and system entities directly from the search bar
- **Responsive "Deep Night" Architecture** — adaptive sidebar drawer for mobile/tablet viewports
- **Surgical Metadata** — high-density UI with absolute borders and zero shadow policy for professional engineering scanning

### Social Login (OAuth2)
- Social connector CRUD (Google, GitHub, Microsoft, Facebook, Apple, Twitter, LinkedIn, Custom)
- Full OAuth2 callback flow — auto-creates user, issues JWT, redirects to dashboard
- **Linked social accounts UI** — view/unlink social accounts on the Security page
- Custom provider support with manual OAuth URL configuration

### User Management (Admin)
- Full CRUD for users, roles, permissions, and groups
- Role-based access control (RBAC) with granular permissions (`module:action` format)
- **Custom user fields** — admin-defined extra profile fields with dynamic form rendering
- User invitations with email delivery and token validation
- Soft/hard delete with account recovery (30-day window)
- Bulk role assignment, status management (active, pending, suspended, locked)

### Audit & Analytics
- Comprehensive audit logging (action, method, endpoint, status code, IP, user agent)
- **Analytics dashboard** — user growth (area chart), login activity, role distribution, and churn prediction
- Export analytics as JSON, export audit logs as JSON or CSV

### Advertisement System
- Full CRUD for advertisements with 6 designated placement positions
- Image banners, HTML content, and Script-based ad support
- Impression and click tracking with CTR analytics

### System Configuration
- Key-value settings organized by category: **App**, **Auth**, **Email**, **Security**
- **Dynamic branding** — site name and logo URL reflected in sidebar, auth pages, and browser title
- **Announcement Banner** — admin-configurable site-wide message bar at the top of the dashboard

### Real-time Connectivity
- **WebSocket gateway** (Socket.IO) for instant in-app notifications
- **Bell icon** in topbar with unread count badge and real-time refresh
- **Structured Logging** — Winston logger with log rotation and admin log viewer (`/system-logs`)

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
| WebAuthn | @simplewebauthn/server, @simplewebauthn/browser |
| Logging | Winston (console + file with rotation) |
| API Docs | Swagger/OpenAPI via `@nestjs/swagger` |

## Project Structure

```
nestjs-mongodb-setup-utils/
├── server/                        # NestJS backend
│   ├── src/
│   │   ├── common/                # Guards, decorators, enums, constants
│   │   ├── config/                # Database, JWT, Seeding logic
│   │   ├── modules/
│   │   │   ├── admin/             # User management, session auditing, 2FA reset
│   │   │   ├── auth/              # Authentication, impersonation, WebAuthn
│   │   │   ├── analytics/         # User & login metrics
│   │   │   ├── session/           # Active session persistence & event logging
│   │   │   └── system-config/     # Dynamic application settings
│   │   └── utils/                 # UserAgent parsing, Bcrypt, TOTP helpers
│
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # Responsive Sidebar (Drawer) & Topbar
│   │   │   └── ui/                # High-density surgical components
│   │   ├── hooks/                 # useAppSettings, useSidebar, usePermissions
│   │   ├── pages/                 # UI Modules (Settings, Users, Analytics, etc.)
│   │   └── stores/                # Zustand (Auth, Sidebar stores)
```

## Getting Started

### Prerequisites

- **Node.js** 20+
- **MongoDB** 6+ (local or Atlas)
- **npm** 9+

### 1. Clone & Install

```bash
git clone <repository-url>
cd nestjs-mongodb-setup-utils

# Backend Setup
cd server
cp .env.development .env
npm install
npm run start:dev

# Frontend Setup
cd ../client
npm install
npm run dev
```

### 2. Default Credentials

The system seeds a super administrator on first run:
- **Email:** `dev@example.com` / `superadmin@example.com`
- **Password:** `DevPassword123!`
- **Role:** `super_admin`

## API Overview

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/auth` | Login, 2FA, Passkeys, Recovery, Impersonation |
| Admin | `/admin/users` | User CRUD, session termination, 2FA resets |
| Sessions | `/sessions` | Global session tracking & remote logout |
| Analytics | `/admin/analytics` | System-wide performance and growth charts |
| Audit | `/admin/audit-logs` | Transactional activity logging |
| Settings | `/admin/settings` | Dynamic branding and security configuration |

## License

MIT
