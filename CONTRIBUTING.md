# Contributing to NestJS MongoDB Modular Architecture

Thank you for considering contributing to this project! This document outlines the coding standards, workflows, and principles that ensure our codebase remains high-performance, modular, and maintainable.

## 🏛️ Architecture Philosophy
- **Modular Monolith:** Each feature (Auth, User, Role, etc.) must reside in its own encapsulated module in `server/src/modules`.
- **Surgical UI:** The frontend (`client`) follows a "Deep Night" surgical aesthetic—pixels over shadows, borders over depth, and high data density.
- **DMS Standard:** Follow the established NestJS SDK-SRV split pattern for business logic abstraction.

## 💻 Coding Standards

### Frontend (React + Tailwind v4)
- **Component Anatomy:** Always use functional components with standard React Hooks.
- **Styling:** Use Tailwind v4 for layout and theme-defined values. Avoid ad-hoc inline styles.
- **Accessibility:** Use semantic HTML (`nav`, `main`, `section`, `article`). All interactive elements must have unique `id`s for automated testing.
- **State Management:** Use Context API for global UI state (Sidebar, Theme) and local `useState` for component-level data.

### Backend (NestJS + MongoDB)
- **Schema Validation:** Every controller endpoint must have a validated DTO using `class-validator` and `class-transformer`.
- **OpenAPI:** Adhere to Task 82—all new endpoints must be documented with `@ApiProperty`, `@ApiOperation`, and `@ApiResponse` with examples.
- **Service Layer:** Logic should reside in Services, not Controllers. Use the `api.get`, `api.post` pattern for cross-module calls if necessary.
- **Error Handling:** Use `GlobalExceptionFilter` and standardized error responses.

## 🛠️ Development Workflow

1. **Feature Branching:** Use descriptive branch names like `feature/audit-logs` or `fix/auth-callback`.
2. **Commit Messages:** Follow conventional commits (e.g., `feat: login flow`, `fix: sidebar hydration`).
3. **Seeding:** Always move hardcoded seed data to `src/config/seed.json`. Use `scripts/seed.ts` for dummy data generation.

## 🧪 Testing Guidelines
- Use **Faker.js** for generating large-scale test datasets (1,000+ users) to verify UI performance under stress.
- Performance over complexity—optimize render cycles in high-density grids.

---
*Maintained with surgical precision for engineering excellence.*
