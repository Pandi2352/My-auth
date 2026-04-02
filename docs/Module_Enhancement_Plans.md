# Module-Wise Enhancement Plans

This document provides a detailed technical roadmap for enhancing each core module of the application to ensure it remains a premier, scalable foundation for enterprise development.

---

## 1. **Authentication & Identity Module**
*   **Magic Link Authentication:** Add `auth/magic-login` to allow login via a signed token sent directly to the user's email.
*   **WebAuthn (Passkeys):** Integration with FIDO2 for hardware-based biometrics (TouchID, FaceID, Security Keys).
*   **Account Locking Logic:** Enhance the current lockout to include "Increasing Delay" (e.g., 5 min -> 15 min -> 1 hour) instead of a fixed duration.
*   **OAuth2 Scope Mapping:** Dynamically map social profile fields (e.g., GitHub username, Google profile ID) into the user's custom fields on registration.

---

## 2. **RBAC & Permissions Module**
*   **Dynamic Permission Matrix UI:** A grid-based admin interface to manage multiple role/permission relationships in one action.
*   **Inherited Group Permissions:** Redesign groups to have an associated "Default Role" that all members automatically receive.
*   **Self-Healing Seed Logic:** Auto-detect missing permissions when new modules are registered in the `AppModule` and upsert them on startup.
*   **RBAC Auditing:** A tool to generate a "Permission Lineage" report showing how a specific user received a given permission (Role vs. Group vs. Individual).

---

## 3. **User & Custom-Field Module**
*   **Bulk User Operations:** Multi-record actions on the User List (e.g., "Assign Role X to 10 selected users").
*   **Condition-based Custom Fields:** Only show certain custom fields in the UI based on the user's "Primary Role" or other attributes.
*   **User Onboarding Flow:** Configurable multi-step onboarding (Profile Info -> Custom Fields -> 2FA setup) with completion tracking.
*   **Avatar Processing:** Add server-side image optimization (resizing, WebP conversion) 
on avatar upload to save bandwidth and storage.

---

## 4. **Advertisement Module**
*   **Advanced User Segment Targeting:** Deliver ads filtered by permissions or custom fields (e.g., show "Upgrade" ads only to users without the `admin` role).
*   **A/B Variant Comparison:** Support multiple ad versions per placement with statistical tracking to determine the winning variant.
*   **Geo-IP Ad Filtering:** Show localized ads based on the user's current session IP location.
*   **Ad-Block Detection:** Implement frontend detection to show "Notice" or "Fallback" banners when 3rd-party ad-blockers are active.

---

## 5. **Analytics & Audit Module**
*   **Real-time Activity Feed:** A WebSocket-powered feed on the dashboard showing live events as they happen across the system.
*   **Pre-Aggregated Summary Collections:** Store daily/weekly counts in a separate collection to allow for extremely fast chart loading for years of data.
*   **Export Customization:** Allow admins to select specific date ranges and field columns for their audit log CSV and JSON exports.
*   **Trend Visualization:** Add a "Predictive Churn" chart using basic linear regression on login frequency trends.

---

## 6. **Notification Module**
*   **Web-Push Integration:** Implement the Web Push API to send browser notifications even when the application tab is closed.
*   **Preference-Aware Templates:** Allow localized (multi-language) email templates based on the user's `language` preference.
*   **In-App Action Center:** Transform the current notification bell into an interactive portal where users can "Approve" or "Reject" requests directly from the notification.

---

## 7. **System & Seed Module**
*   **Environment-Aware Seeding:** Restrict dev-specific users (`dev@example.com`) to `development` mode while ensuring a `root_admin` exists in `production`.
*   **Configuration-Driven Seeding:** Move the hardcoded lists in `SeedService` to an external JSON/YAML file for easier updates without code changes.
*   **Feature-Flag Management:** A dashboard to toggle specific modules or features across the system globally (e.g., "Toggle Ad System OFF" during maintenance).
*   **Database Cleanup Tasks:** Scheduled Cron tasks to automatically purge session/audit logs older than X months based on system settings.
