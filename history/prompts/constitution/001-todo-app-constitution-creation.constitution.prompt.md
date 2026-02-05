---
id: 001
title: Todo App Constitution Creation
stage: constitution
date: 2026-01-09
surface: agent
model: claude-opus-4-5-20251101
feature: none
branch: master
user: user
command: /sp.constitution
labels: ["constitution", "phase-2", "todo-app", "better-auth", "fastapi"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - null
---

## Prompt

# Phase II: Todo Full-Stack Web Application Constitution

## Objective
Transform the console-blus    |
| Authentication  | Better Auth (JWT)              |

---

## REST API Endpoints

| Method | Endpoint                          | Description          |
|--------|----------------------------------|--------------------|
| GET    | /api/{user_id}/tasks              | List all tasks      |
| POST   | /api/{user_id}/tasks              | Create a new task   |
| GET    | /api/{user_id}/tasks/{id}         | Get task details    |
| PUT    | /api/{user_id}/tasks/{id}         | Update a task       |
| DELETE | /api/{user_id}/tasks/{id}         | Delete a task       |
| PATCH  | /api/{user_id}/tasks/{id}/complete| Toggle completion   |

---

## Securing the REST API: Better Auth + FastAPI

**Challenge:** Better Auth runs on frontend, backend is separate in Python. Backend must verify user making API requests.

**Solution:** JWT Tokens

**Workflow:**
1. User logs in on Frontend → Better Auth issues JWT token.
2. Frontend includes JWT in header:
   `Authorization: Bearer <token>`
3. Backend verifies token using **shared secret**.
4. Backend decodes token → gets `user_id` → filters tasks.
5. Only the authenticated user's tasks are returned.

**Changes Required per Component**

| Component             | Change Required                                           |
|----------------------|----------------------------------------------------------|
| Better Auth Config    | Enable JWT plugin to issue tokens                        |
| Frontend API Client   | Attach JWT token to every request header                |
| FastAPI Backend       | Add middleware to verify JWT and extract user           |
| API Routes            | Filter queries by authenticated user ID                 |

**Shared Secret**
- Environment variable: `BETTER_AUTH_SECRET`
- Must be identical on frontend and backend.

**Security Benefits**
- User Isolation: Users only see their own tasks.
- Stateless Auth: Backend does not need to query frontend.
- Token Expiry: JWT expires automatically (e.g., 7 days).
- No Shared DB Session: Frontend/backend verify auth independently.

**API Behavior After Auth**
- All endpoints require JWT.
- Requests without token → 401 Unauthorized.
- Users only see/modify their own tasks.
- Task ownership enforced on all operations.

---

## Monorepo Organization

**Folder Structure:**

## Response snapshot

Created the project constitution for the Phase II Todo Full-Stack Web Application with:

**6 Core Principles:**
1. Monorepo Architecture - Frontend/Backend in same repo with clear separation
2. JWT-Based Authentication - Better Auth JWT with shared secret verification
3. User Data Isolation (NON-NEGOTIABLE) - Users only access their own data
4. RESTful API Design - Standard REST patterns for task endpoints
5. Test-First Development - Unit, integration, contract, and security tests
6. Environment-Based Configuration - Externalized secrets via env vars

**Additional Sections:**
- Technology Stack table (Next.js, FastAPI, PostgreSQL, Better Auth)
- Security Requirements with authentication flow and controls
- Governance rules with amendment process and compliance requirements

**Version**: 1.0.0 (Initial creation - MAJOR version bump)

## Outcome

- ✅ Impact: Established foundational governance document for Phase II Todo app
- 🧪 Tests: N/A - Constitution document
- 📁 Files: .specify/memory/constitution.md (created/updated)
- 🔁 Next prompts: /sp.specify to create feature specs, /sp.plan for architecture
- 🧠 Reflection: Constitution captures key security requirements (JWT, user isolation) and tech stack decisions from user input

## Evaluation notes (flywheel)

- Failure modes observed: None - straightforward constitution creation
- Graders run and results (PASS/FAIL): N/A - manual review required
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
