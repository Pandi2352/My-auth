# Project Features & Next Expansion Plans

This document outlines the current feature set and the roadmap for the next development cycles, focused on innovation and enterprise-grade scaling.

---

## 🚀 Current Milestone Features
*   **Complete Auth Cycle:** JWT Login (Access/Refresh), 2FA (TOTP), Internal Impersonation.
*   **Granular RBAC:** Module:Action permission mapping with system role hierarchy.
*   **Entity Management:** User groups, invitations, and soft-delete/recovery.
*   **Custom Fields:** Admin-defined JSON-based user profile extensions with 8 field types.
*   **Ad Engine:** Placement-controlled advertising system with impression/click tracking.
*   **Real-time Logic:** WebSocket notifications (Socket.io) and live dashboard status.
*   **System Admin:** Category-based site settings, global announcements, and admin log viewer.

---

## 🛠 Next Phase Features (Immediate Goals)

### 1. **Passwordless & Magic Auth**
*   **Passkeys (WebAuthn):** Enable hardware-based login (FaceID/Fingerprint) for a passwordless experience.
*   **Magic Links:** Send one-time secure links to emails for effortless frictionless entry.

### 2. **Advanced Administration**
*   **Bulk Management:** Multi-select operations on the User List (Change roles, suspend counts).
*   **Permission Matrix:** A spreadsheet-style UI to manage all permissions for all roles in one view.
*   **Onboarding Orchestrator:** Configurable multi-step onboarding flows for new users.

### 3. **Smart Targeted Ads**
*   **Dynamic Targeting:** Deliver ads based on User Group or Custom Field values (e.g., specific messages for 'Premium' users).
*   **A/B Variant Testing:** Rotational ad versions to optimize CTR performance automatically.

### 4. **Enterprise Integrations**
*   **SCIM 2.0 Provisioning:** Direct synchronization with Identity Providers like Okta and Azure AD.
*   **Webhook Subscriptions:** Allow developers to subscribe to system events (`user:registered`, `role:changed`).

---

## 📈 Optimization & Infrastructure Performance

### **Redis Layering**
*   Offload Token Blacklisting, Throttling, and Rate-limiting to Redis.
*   Implement shared real-time sessions for horizontally scaled cloud nodes.

### **Aggregation Materialization**
*   Transform high-cost MongoDB Analytics lookups into pre-calculated hourly/daily summaries.
*   Async tracking for Ad Impressions to decoupling data-collection from page-renders.

---

## 🔮 Vision Phase (Advance Innovation)

### **Intelligence & Security AI**
*   **Churn Prediction:** Surface "at-risk" users who haven't logged in based on activity trends.
*   **Log-Anomaly Detection:** AI-assisted log analysis to identify brute-force patterns or unusual admin behavior.

### **Zero-Trust Logic**
*   Implement short-lived access periods for mission-critical operations.
*   Real-time heartbeats to ensure authorized presence throughout high-privilege sessions.

### **Multitenancy & White-labeling**
*   Full support for separate data silos and custom branding per customer/group.
*   Dynamic CSS/Theme injection based on user context.

---

## 📊 Summary of Next Plans

| Priority | Feature/Plan | Impact | Dev Level | 
|----------|--------------|--------|-----------|
| **CRITICAL** | Redis Rate Limiting | Stability | Medium |
| **HIGH** | Passkeys (WebAuthn) | Security | High |
| **HIGH** | Bulk User Operations | Efficiency | Low |
| **MEDIUM** | Magic Link Login | UX | Low |
| **MEDIUM** | SCIM 2.0 Support | Scaling | High |
| **LOW** | Churn Analytics | Insight | Very High |
