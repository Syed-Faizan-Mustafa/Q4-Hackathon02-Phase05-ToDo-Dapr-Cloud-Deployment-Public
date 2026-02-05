# ADR-0002: Authentication Architecture

- **Status:** Accepted
- **Date:** 2026-01-09
- **Feature:** 001-frontend-todo
- **Context:** The frontend must authenticate users and communicate securely with a separate FastAPI backend. Per the project constitution, Better Auth is required for JWT-based authentication with a shared secret between frontend and backend. The architecture must handle session management, token attachment to API requests, and security edge cases (401/403 errors, session expiry).

## Decision

We will use the following integrated authentication architecture:

- **Auth Provider**: Better Auth with official Next.js App Router integration
- **Token Strategy**: JWT tokens issued by Better Auth, 7-day expiry
- **Session Storage**: Secure httpOnly cookies managed by Better Auth
- **API Communication**: Axios with request interceptors for automatic JWT attachment
- **Token Refresh**: Handled by Better Auth session management
- **Error Handling**: Centralized interceptor redirects 401 to signin, shows message for 403
- **Shared Secret**: `BETTER_AUTH_SECRET` environment variable (identical on frontend/backend)

The authentication flow:
1. User signs up/in via Better Auth on frontend
2. Better Auth issues JWT, stores in secure cookie
3. Axios interceptor extracts token and attaches to every API request
4. Backend verifies JWT using shared secret
5. 401/403 responses trigger appropriate frontend actions

## Consequences

### Positive

- **Security by Default**: Better Auth handles CSRF, secure cookies, token rotation
- **Stateless Backend**: JWT verification requires no database lookup on backend
- **Consistent Auth Header**: Axios interceptor eliminates risk of forgetting auth header
- **Session Persistence**: Cookie storage survives page refresh; no localStorage security risks
- **User Isolation**: user_id in JWT enables per-user API path enforcement
- **Single Integration Point**: All auth logic centralized in `lib/auth.ts` and `lib/api.ts`

### Negative

- **Shared Secret Management**: BETTER_AUTH_SECRET must be kept in sync across frontend/backend deployments
- **Cookie-Based Limitations**: Cross-origin requests require proper CORS configuration
- **Token Expiry UX**: 7-day tokens may require handling mid-session expiry gracefully
- **Better Auth Coupling**: Switching auth providers requires rewriting auth layer
- **Interceptor Complexity**: Request interceptor async pattern adds slight complexity to API client

## Alternatives Considered

**Alternative A: NextAuth.js + Custom JWT Handling**
- Pros: More established ecosystem, flexible providers
- Rejected: Project constitution specifies Better Auth; migration adds unnecessary risk

**Alternative B: Custom JWT Implementation (no auth library)**
- Pros: Full control, no library dependency
- Rejected: Reinventing auth is error-prone; Better Auth handles security edge cases (CSRF, token rotation, secure storage)

**Alternative C: Firebase Authentication**
- Pros: Comprehensive auth solution, social logins out of box
- Rejected: External Google dependency; different architecture than specified; adds complexity for simple email/password auth

**Alternative D: Server-Only API Calls (no client JWT)**
- Pros: No client-side token handling, simpler security model
- Rejected: Limits client-side interactivity; conflicts with real-time UI updates requirement

## References

- Feature Spec: specs/001-frontend-todo/spec.md (FR-007, FR-008, FR-010)
- Implementation Plan: specs/001-frontend-todo/plan.md (Architecture Decisions section 3)
- Research Document: specs/001-frontend-todo/research.md (Sections 1, 2)
- API Contract: specs/001-frontend-todo/contracts/api-client.md (Authentication Endpoints)
- Constitution: .specify/memory/constitution.md (Principle II: JWT-Based Authentication)
- Related ADRs: ADR-0001 (Frontend Technology Stack)
