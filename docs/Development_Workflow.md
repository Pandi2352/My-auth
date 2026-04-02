# Developer Onboarding & Workflow Guide

Welcome to the project! This guide ensures that all developers follow a consistent technical standard, resulting in a high-quality, maintainable code-base.

---

## 🛠 1. Local Development Setup

### **Prerequisites**
*   **Node.js:** 20+ (LTS)
*   **MongoDB:** 6.0+ (Local or Atlas)
*   **Editor:** VS Code (Recommended)
*   **Extensions:** ESLint, Prettier, Tailwind CSS IntelliSense, Thunder Client (for API testing).

### **Quick Start**
1.  **Clone:** `git clone <repo-url>`
2.  **Server:** `cd server && cp .env.development .env && npm install && npm run start:dev`
3.  **Client:** `cd client && cp .env.example .env && npm install && npm run dev`
4.  **Admin Login:** 
    *   **User:** `superadmin@example.com` / `dev@example.com`
    *   **Password:** `AdminPassword123!` / `DevPassword123!`

---

## 📏 2. Coding Standards & Naming Conventions

Consistency is critical for automated tooling and grepability.

### **Naming Conventions**
| Type | Convention | Example |
|------|------------|---------|
| **Folders** | `kebab-case` | `custom-field`, `in-app-notification` |
| **Files** | `kebab-case` | `user.service.ts`, `auth.controller.ts` |
| **Classes/Components** | `PascalCase` | `UserService`, `UserCard.tsx` |
| **Frontend Variables** | `camelCase` | `isLoading`, `userData` |
| **Backend API Keys** | `snake_case` | `first_name`, `is_verified` (matches MongoDB) |
| **Constants/Enums** | `SCREAMING_SNAKE_CASE` | `MAX_LOGIN_ATTEMPTS`, `USER_STATUS` |

### **File Structure**
*   **Server:** Follow the NestJS modular pattern (`module`, `controller`, `service`, `schema`, `dto`).
*   **Client:** Atomic/Page pattern (`components/ui`, `components/forms`, `pages/module-name`, `stores/`).

---

## 🚀 3. Technical Workflow

### **Git Branching & Commits**
Follow **Conventional Commits**:
*   `feat: add magic-link authentication`
*   `fix: resolve refresh token expiration logic`
*   `chore: update dependencies`
*   `docs: update onboarding guide`

### **Feature Development Lifecycle**
1.  **Backend First:** Define the DTO, then the Schema, then the Service logic, and finally the Controller.
2.  **API Testing:** Test using Thunder Client/Postman before building the UI.
3.  **Frontend Implementation:** 
    *   Define types in `client/src/types/`. 
    *   Add API endpoint in `client/src/lib/api/endpoints.ts`.
    *   Implement store logic in `client/src/stores/`.
    *   Build the Page/Component.

### **State Management (Zustand)**
*   Only use global stores for persistent data (Auth, Site Settings, Notifications).
*   For page-specific data (Filters, Pagination), use `useState` or `useSearchParams`.

---

## ✅ 4. The Pull Request (PR) Checklist

Before submitting a PR, ensure you can tick all these boxes:

1. [ ] **Lint & Format:** `npm run lint` and `npm run format` pass on both client and server.
2. [ ] **Sensitive Data:** No `.env` secrets or hardcoded passwords leaked in code.
3. [ ] **Naming:** All API fields follow `snake_case` and frontend components follow `PascalCase`.
4. [ ] **Error Handling:** API calls use `try/catch` with appropriate `ErrorEntity` responses on the server.
5. [ ] **Responsiveness:** UI looks correct on both Desktop (1440px) and Mobile (375px).
6. [ ] **No Console Logs:** All `console.log` and `debugger` statements removed.
7. [ ] **Self-Review:** You have read your own diff one final time to catch obvious mistakes.

---

## 🛠 5. Useful Commands

*   **Server:**
    *   `npm run build`: Production build.
    *   `npm run test`: Run unit tests.
    *   `npm run start:prod`: Start production server.
*   **Client:**
    *   `npm run build`: Generate production assets inside `/dist`.
    *   `npm run preview`: Test the production build locally.

---

## 🆘 Support & Troubleshooting
*   **DB Connection Error:** Ensure your IP is whitelisted in MongoDB Atlas or local MongoDB service is running (`services.msc`).
*   **CORS Issues:** Check `CORS_ORIGIN` in the server `.env` file matches your client URL.
*   **JWT Issues:** If getting 401 on all requests, clear your browser `localStorage` and log in again.
