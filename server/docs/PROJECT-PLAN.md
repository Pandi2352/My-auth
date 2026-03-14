# User Management System — Project Plan

## Tech Stack

- **Backend:** NestJS (TypeScript)
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (Access + Refresh Tokens)
- **Docs:** Swagger / OpenAPI
- **Email:** Nodemailer (SMTP)
- **Security:** bcrypt, rate-limiting, TOTP (2FA)

---

## Module Overview

| # | Module | Priority | Sprint |
|---|--------|----------|--------|
| 1 | Authentication | Critical | Sprint 1 |
| 2 | User Profile Management | Critical | Sprint 2 |
| 3 | Role Management | High | Sprint 3 |
| 4 | Permission Management | High | Sprint 3 |
| 5 | Authorization & Access Control (RBAC) | High | Sprint 4 |
| 6 | Admin User Management | High | Sprint 5 |
| 7 | Session Management | Medium | Sprint 6 |
| 8 | Security Features | Medium | Sprint 6 |
| 9 | User Status Management | Medium | Sprint 7 |
| 10 | Notifications & Email | Medium | Sprint 7 |
| 11 | Audit & Activity Logging | Medium | Sprint 8 |
| 12 | User Analytics | Low | Sprint 9 |
| 13 | User Groups / Teams | Low | Sprint 9 |
| 14 | System Configuration | Low | Sprint 10 |
| 15 | Advanced Enterprise Features | Low | Sprint 10 |

---

## Folder Structure (Planned)

```
src/
├── config/                     # App, DB, Swagger, JWT config
├── common/
│   ├── decorators/             # Custom decorators (@Roles, @Permissions, @CurrentUser)
│   ├── guards/                 # AuthGuard, RolesGuard, PermissionsGuard
│   ├── interceptors/           # Logging, Transform interceptors
│   ├── filters/                # Global exception filters
│   ├── pipes/                  # Validation pipes
│   └── constants/              # App-wide constants
├── modules/
│   ├── auth/                   # Authentication module
│   ├── user/                   # User & Profile module
│   ├── role/                   # Role module
│   ├── permission/             # Permission module
│   ├── session/                # Session management module
│   ├── audit-log/              # Audit & activity logging module
│   ├── notification/           # Email & notification module
│   ├── user-group/             # User groups / teams module
│   └── analytics/              # User analytics module
├── utils/                      # Utility classes (existing)
└── main.ts
```
