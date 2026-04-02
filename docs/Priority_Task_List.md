# Comprehensive Project Task List (Priority-Wise)

This document contains 100+ actionable tasks organized by priority to guide the development and scaling of the system.

---

## 🔴 Priority: Critical (P0) - Security, Stability & Core Logic
*Essential for production readiness and system integrity.*

### **Security & Identity**
1. [ ] Implement Redis-based token revocation for sub-millisecond session validation.
2. [ ] Add `refresh_token` rotation with automatic reuse detection (revoke all if reused).
3. [ ] Force password reset on the next login if an account has been suspended for >30 days.
4. [ ] Implement WebAuthn (Passkeys) for passwordless biometric login.
5. [ ] Add "Increasing Exponential Delay" to the account lockout logic (5m, 15m, 1h, 24h).
6. [ ] Implement CSRF protection for all mutating state requests (`POST`, `PATCH`, `DELETE`).
7. [ ] Sanitize all `custom_fields` input on the server side to prevent XSS.
8. [ ] Implement rate-limiting globally with separate "Login" and "Public API" thresholds.
9. [ ] Add a "Security Key" requirement for Admin Impersonation.
10. [ ] Encrypt sensitive `social_connector` secrets in the database (e.g., Client Secret).

### **Stability & Logging**
11. [ ] Implement a global error interceptor to prevent stack traces from leaking to the client in production.
12. [ ] Set up Winston log rotation for 30 days instead of 10MB to ensure historical data availability.
13. [ ] Add unique Request-IDs to all logs for traceability from UI to Backend.
14. [ ] Implement a "Dead Letter Queue" (DLQ) for failed notification emails.
15. [ ] Fix any unhandled promise rejections in the `onModuleInit` seed logic.
16. [ ] Ensure MongoDB indexes are created for `audit_logs` to prevent slow queries during scaling.
17. [ ] Set up automated database backups (daily) with cloud storage (S3/GCP).
18. [ ] Implement a circuit-breaker for the `SocialAuth` callback to prevent API hanging.
19. [ ] Add `PreconditionFailed` check for updating system settings (prevent concurrency issues).
20. [ ] Ensure all API responses follow a consistent `data` and `error` envelope.

---

## 🟠 Priority: High (P1) - Core Feature Gaps & Admin Efficiency
*Important for user experience and administrative control.*

### **Admin & User Management**
21. [ ] Implement "Bulk Update Role" on the User List page (DataTable integration).
22. [ ] Add "Bulk Suspend/Activate" for selected users.
23. [ ] Create a "Permission Matrix" grid view in the Role Detail page.
24. [ ] Implement "Inherited Permissions" for Groups (Group Roles -> Members).
25. [ ] Add a "Last Active" column to the User Data Table (Real-time update from sessions).
26. [ ] Create a "Role Change" security audit event when an admin modifies user roles.
27. [ ] Implement custom "Account Recovery" flows with manual admin approval toggle.
28. [ ] Add "Module-wise Search" in the Permissions inventory page.
29. [ ] Enable "User Export" specifically for filtered results (e.g., Export only 'Suspended' users).
30. [ ] Implement an "Admin Dashboard" activity feed showing real-time logins and signups.

### **Authentication & Social**
31. [ ] Add "Magic Link" login as an alternative to passwords.
32. [ ] Implement OAuth2 scope configuration for each Social Connector (e.g., `read:org` for GitHub).
33. [ ] Add "Link Account" button on the profile page for already-logged-in users.
34. [ ] Implement "One-Time Password" (OTP) via Email for highly sensitive settings changes.
35. [ ] Create a "Device Recognition" system notifying users of logins from new browsers.
36. [ ] Enable "2FA Backup Codes" (10 codes generated on 2FA activation).
37. [ ] Implement "Idle Session Timeout" configurable per role (e.g., Admins log out faster).
38. [ ] Add "Remember Me" toggle influence on standard Access Token TTLs.
39. [ ] Create a "Social Login Profile Completion" prompt for missing `phone` or `custom_fields`.
40. [ ] Set up dynamic login buttons based on the `SocialConnector` "is_active" status.

### **Notifications & Communication**
41. [ ] Create professionally designed HTML email templates (MJML or similar).
42. [ ] Implement "Web Push" notifications for in-app alerts.
43. [ ] Add "Mark All as Read" button in the Topbar Notification Bell.
44. [ ] Allow users to "Mute" specific notification categories (e.g., No 'Login Alerts').
45. [ ] Set up "Broadcast Notifications" that admins can send to all active sessions.
46. [ ] Implement "Actionable Notifications" (e.g., "Approve" button directly in the bell).
47. [ ] Create a "Mail Log" admin page to track every transactional email sent.
48. [ ] Add "In-App Announcement" duration (e.g., "Show this banner for only 24 hours").
49. [ ] Implement "Notification Preferences" sync with the browser's native permission API.
50. [ ] Ensure notifications are deleted automatically after 90 days.

---

## 🟡 Priority: Medium (P2) - UI/UX Polish & Optimization
*Enhances usability and overall feel of the product.*

### **Frontend & UI Components**
51. [ ] Implement "Skeleton Loaders" for all Dashboard charts during initial data fetch.
52. [ ] Add a "Password Strength Meter" to the "Change Password" modal on the profile.
53. [ ] Implement "Infinite Scroll" or "Load More" for the Audit Log table.
54. [ ] Create a "Command Palette" (Cmd+K) shortcut for quick navigation between User, Roles, and Settings.
55. [ ] Add "Tooltips" to every permission slug in the matrix to explain what it does.
56. [ ] Implement "Optimistic Updates" for toggling User Status (Active/Suspended).
57. [ ] Create "Empty State" illustrations for the Advertisement and Custom Fields pages.
58. [ ] Ensure "Breadcrumbs" are consistently visible and interactive on deep navigation.
59. [ ] Implement "Dark Mode" toggle preservation in LocalStorage (auto-sync with OS).
60. [ ] Add "Copy to Clipboard" buttons for API Key Secrets and User IDs.

### **Backend Optimization**
61. [ ] Transition Ad Tracking impressions/clicks to a background job (BullMQ).
62. [ ] Pre-aggregate "Daily User Growth" stats once a day into a `Statistics` collection.
63. [ ] Implement `Cache-Control` headers for static assets like avatars and global settings.
64. [ ] Profile MongoDB queries and add missing compound indexes for `Search + Filter` UI.
65. [ ] Minify JWT payloads to only include essential `sub` and `role_ids`.
66. [ ] Implement "Graceful Shutdown" for the NestJS server (waiting for active DB ops).
67. [ ] Optimize the `SeedService` to only run if the version in `package.json` changes.
68. [ ] Use Winston's `child` loggers for each request to group related log lines.
69. [ ] Compress API responses using `brotli` or `gzip` middleware.
70. [ ] Refactor the `Common` module to remove circular dependencies during start-up.

### **Ad & Analytics Improvements**
71. [ ] Add target filtering to Ads (e.g., "Show ad ONLY to Super Admins").
72. [ ] Implement "Auto-refresh" for Dashboard charts every 5 minutes.
73. [ ] Create an "Ad Performance" donut chart on the main dashboard overview.
74. [ ] Allow adding "Internal Notes" to advertisements for admin tracking.
75. [ ] Implement "Geo-Locality" summary in analytics (e.g., "Most logins from New York").
76. [ ] Create a "Top 10 Most Active Users" list based on audit log frequency.
77. [ ] Enable "CSV Export" for Login History from the Security page.
78. [ ] Implement ad-priority weighting for overlapping schedules.
79. [ ] Add "Impression Tiers" (Notify admin when an ad hits 1M impressions).
80. [ ] Create a "Public Ad API" for 3rd party consumption with CORS restrictions.

---

## 🟢 Priority: Low (P3) - Future Growth, Docs & Refactoring
*Long-term quality and developer experience.*

### **Developer Experience & Tooling**
81. [ ] Move hardcoded seed data to a `seed.json` configuration file.
82. [ ] Set up Swagger/OpenAPI with full "Request/Response" examples for all endpoints.
83. [ ] Implement a `faker.js` script to generate 1,000 dummy users for testing.
84. [ ] Write Unit Tests for the `AuthService` core validation logic.
85. [ ] Set up E2E tests (Cypress/Playwright) for the "Forget Password" flow.
86. [ ] Create a `CONTRIBUTING.md` with coding standards for the project.
87. [ ] Implement a "Development Banner" that shows the current Git Commit ID in the footer.
88. [ ] Add "Schema Validation" tests to ensure MongoDB models match the DTOs.
89. [ ] Create a Docker Compose setup for local development. 
90. [ ] Set up a GitHub Action for "Lint and Type Check" on every PR.

### **UI Accessibility & Polish**
91. [ ] Ensure full keyboard navigation (Tab/Enter) for the main sidebar and modals.
92. [ ] Implement ARIA labels for all icon-only buttons.
93. [ ] Add "Haptic Feedback" (subtle color shifts) for interactive dashboard elements.
94. [ ] Create a "Privacy Policy" and "Terms" stub pages for the login footer.
95. [ ] Implement "Multi-language" (i18n) support for the frontend UI.
96. [ ] Add a "Favicon" that matches the site logo from settings.
97. [ ] Implement "Scroll-to-top" when clicking breadcrumbs.
98. [ ] Optimize "First Meaningful Paint" by splitting the main JS bundle.
99. [ ] Create a "404 Not Found" page with a helpful link back to the dashboard.
100. [ ] Implement a "Custom CSS" admin setting for white-label styling tweaks.

---

## 🏁 Summary of Milestone Goals

*   🚀 **Phase 1 (Critical):** Redis Auth, Passwordless, Rate-limiting, and DLQ for Emails.
*   🛠 **Phase 2 (High):** Bulk Admin Tools, Notification Improvements, and Social Auth polish.
*   💎 **Phase 3 (Medium):** UI Refinement, Chart Skeletons, and MongoDB Performance tuning.
*   📚 **Phase 4 (Low):** Testing coverage, Multi-language support, and SCIM 2.0 readiness.
