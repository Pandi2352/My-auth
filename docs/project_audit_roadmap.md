# Project Audit & Strategic Roadmap

This document provides a module-wise breakdown of the current system, followed by proposed enhancements, optimizations, and future-forward strategic plans.

---

### 1. **Identity & Security (Auth & Session Modules)**
The core of the system is a high-fidelity authentication engine supports modern security standards.

*   **Current State:**
    *   JWT-based Access/Refresh token flow with revocation.
    *   Native 2FA (TOTP/Google Authenticator) with QR generation and recovery flow.
    *   Admin Impersonation with session state preservation.
    *   Account lockout and automated IP-based security alerting.
    *   Social Connectors (OAuth2) with dynamic button rendering.

*   **Enhancement Plans:**
    *   **Passwordless Logic:** Implement "Magic Links" and WebAuthn (Passkeys) to modernize the entry point and reduce password fatigue.
    *   **Advanced Device Fingerprinting:** Beyond IP and User-Agent, implement canvas fingerprinting to detect session hijacking more accurately.
    *   **Risk-Based Auth:** Force 2FA or email confirmation if a login is detected from an unusual location/device (using a browser fingerprinting library).

*   **Optimization Plans:**
    *   **Redis Integration:** Transition token revocation and rate-limiting from MongoDB/Memory to Redis for sub-millisecond latency and shared state across horizontal nodes.
    *   **Token Rotation Strategy:** Implement automatic reuse detection of refresh tokens (if a token is used twice, revoke all tokens in that family).

*   **Feature Plans:**
    *   **Security Scorecard:** A UI element on the user profile showing a "Security Health" score (2FA on/off, password age, linked accounts).
    *   **Audit-Only Impersonation:** A read-only mode for admin impersonation to ensure privacy while debugging.

*   **Advance Plans:**
    *   **Decentralized Identity (DID):** Future support for verifiable credentials to allow users to own their identity data.
    *   **Zero-Trust Integration:** Implementation of short-lived sessions that require periodic "heartbeats" or re-validation for sensitive actions (`/admin/*`).

---

### 2. **Access Control (Roles, Permissions, Groups)**
A granular RBAC system that handles permission-based UI filtering.

*   **Current State:**
    *   Module-Action based permissions (`user:create`).
    *   Role hierarchy with default auto-assignment.
    *   User Groups for logical categorization and potentially shared permissions.

*   **Enhancement Plans:**
    *   **Dynamic Permission Matrix:** A "Matrix" view in the admin UI where admins can toggle permissions for multiple roles in a single spreadsheet-like grid.
    *   **Inherited Permissions:** Allow Groups to have roles/permissions that are automatically inherited by members.

*   **Optimization Plans:**
    *   **Permission Caching:** Cache the "Resolved Permission Set" (User + Group + Roles) in the application state or JWT payload to avoid complex recursive lookups.

*   **Feature Plans:**
    *   **API Scoping:** Connect RBAC to API Key scopes, allowing "Read-Only" or "Write-Only" API tokens.
    *   **Permission Audit:** A tool to check "Who can do X?" across the entire system.

*   **Advance Plans:**
    *   **ABAC (Attribute-Based Access Control):** Move beyond roles to policies (e.g., "User can edit post ONLY if they are the owner AND current time is before 5 PM").

---

### 3. **User Management & Custom Fields**
The primary interface for administrative operations and user profile flexibility.

*   **Current State:**
    *   Full User CRUD with soft-delete/restore logic.
    *   Dynamic "Custom Fields" (JSON-stored, admin-defined) with 8 field types.
    *   Invitation system with token-based onboarding.

*   **Enhancement Plans:**
    *   **Bulk Operations:** Enable "Bulk Update Role," "Bulk Suspend," and "Bulk Export" on the User List page.
    *   **User Onboarding Flow:** Configurable multi-step onboarding (Initial profile -> Custom fields -> 2FA setup).

*   **Optimization Plans:**
    *   **Projection Tuning:** Ensure only required fields are sent to the client (already implemented, but needs periodic audit for new features).
    *   **Virtual Scrolling:** Implement virtual scrolling for the User List to handle 10,000+ users without performance degradation.

*   **Feature Plans:**
    *   **Data Portability (GDPR):** One-click "Download My Data" that generates a ZIP of all user records, sessions, and custom fields.
    *   **Automated Account Cleanup:** Configurable system task to permanently delete accounts that have been soft-deleted for >30 days.

*   **Advance Plans:**
    *   **SCIM 2.0 Provider:** Allow modern IT departments (Okta, Azure AD) to sync their employee lists directly into your application.

---

### 4. **Advertisement System**
A built-in monetization and outreach tool with placement control.

*   **Current State:**
    *   CRUD for Image/HTML/Script ads.
    *   6 Standard placements with schedule and priority.
    *   Basic impression and click tracking.

*   **Enhancement Plans:**
    *   **Advanced Targeting:** Target ads by Role, Group, or even Custom Field values (e.g., only show "Pro" ads to users with `status: active`).
    *   **A/B Testing:** Allow multiple variants for a single placement to see which ad performs better.

*   **Optimization Plans:**
    *   **Async Tracking:** Move tracking updates to a background queue (BullMQ) or use Redis `HINCRBY` to avoid DB locking high-traffic pages.

*   **Feature Plans:**
    *   **Advertiser Dashboard:** A light-weight view for internal "promoters" to see their CTR and conversion rates.
    *   **Geo-fencing:** Show specific ads based on the user's login IP location (already tracked in sessions).

*   **Advance Plans:**
    *   **External Ad-API:** Allow 3rd party sites to "Embed" your ad placements as a widget.

---

### 5. **Analytics & Audit**
Visualizing system health and user behavior.

*   **Current State:**
    *   Aggregation-driven charts for growth, activity, and distribution.
    *   Winston logger with an integrated Admin Log Viewer.
    *   Audit logs with JSON/CSV export.

*   **Enhancement Plans:**
    *   **Real-time Activity Map:** A world map (D3/Leaflet) showing real-time login events during the session.
    *   **Log Search & Regex:** Enhance the Log Viewer with full-text search and regex filtering.

*   **Optimization Plans:**
    *   **Aggregation Materialization:** Use MongoDB "Scheduled Tasks" to compute analytics summaries once per hour into a dedicated collection (avoiding heavy `$lookup` on cold starts).

*   **Feature Plans:**
    *   **Slack/Discord Alerts:** Send critical system logs (500 errors, failed security audits) directly to a webhook.
    *   **Custom Dashboard Builder:** Allow admins to pin specific charts (e.g., "Active Ad Impressions") to their main overview.

*   **Advance Plans:**
    *   **Prophetic Analytics:** Integrated ML (TensorFlow.js or simple regression) to predict user churn or infrastructure load spikes.

---

### 6. **Infrastructure (Settings & Utilities)**
The "Nervous System" of the application.

*   **Current State:**
    *   Categorized system settings (App, Auth, Email, Security).
    *   Announcement banners (Global broadcast).
    *   Real-time notifications via WebSockets (Socket.io).

*   **Enhancement Plans:**
    *   **Multi-tenant Branding:** Allow different UI themes (Site Name, Logo, Primary Color) based on the domain or specific group.
    *   **Web Push Support:** Real-time browser notifications even when the tab is closed.

*   **Optimization Plans:**
    *   **Settings Cache:** Load settings into memory on start and update only on `settings:update` event, reducing DB hits for every "Site Name" lookup.

*   **Feature Plans:**
    *   **Maintenance Mode:** A "Graceful Shutdown" toggle that shows a custom maintenance page to users while allowing admins to keep working.
    *   **Global Search:** Unified CMD+K search for Users, Roles, Ads, and Settings (Command Palette is 60% there).

---

### 7. **Development & Utilities (Seed Module)**
The automated data provisioning system for development and fresh deployments.

*   **Current State:**
    *   Manual `onModuleInit` seeding of permissions, roles, and admin users.
    *   Uses `upsertBySlug` to prevent duplicates.
    *   Hardcoded default users (`superadmin@example.com`, `dev@example.com`).

*   **Enhancement Plans:**
    *   **External Configuration:** Move seed definitions to a JSON/YAML configuration file for easier management without code changes.
    *   **Environment Filtering:** Prevent `dev@example.com` from being seeded in `production` while ensuring `superadmin` always exists.
    *   **Dynamic Permission Discovery:** Implement a system that scans NestJS controllers for a custom `@Resource()` decorator to automatically generate permission slugs (`resource:action`).

*   **Optimization Plans:**
    *   **Selective Seeding:** Add an environment variable (e.g., `FORCE_SEED=true`) to control when the seed logic runs instead of running every startup.

*   **Feature Plans:**
    *   **Mock Data Factory:** Integration with `faker.js` to optionally seed 100+ realistic users and 1,000+ audit logs for UI/Performance testing.

---

### Summary of Priority Actions

1.  **Immediacy (Low Effort, High Value):** Bulk actions on User List, Redis caching for settings, and Inherited Group Roles.
2.  **Stability:** Move Ad Tracking and Analytics Aggregation to background tasks to prevent main DB bottlenecks.
3.  **Modernization:** Implement Passkeys (WebAuthn) and Geo-fenced ad targeting.
4.  **Dev-Experience:** Decouple Seed logic from the main application lifecycle to a configuration-driven approach.
5.  **Scaling:** Materialized analytics views for high-volume data scanning.
