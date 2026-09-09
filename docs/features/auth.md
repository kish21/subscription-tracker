# Feature: Authentication & Session Lifecycle

- **Ticket:** [M1-SLICE-01] Authentication & Session Lifecycle (`docs/issues/M1-SLICE-01_auth_session.md` / GitHub Issue #1)
- **Status:** Complete & Verified
- **Date:** 2026-09-08

## 1. What was built

Self-hosted authentication and session management using **Better Auth** with the **Drizzle ORM** PostgreSQL adapter:
- **Server Auth Engine (`src/auth/server.ts`)**: Configured with PostgreSQL persistence (`user`, `session`, `account`, `verification` tables), DB-backed rate limiting, 30-day session TTL, and support for custom user currency field.
- **Client Auth SDK (`src/auth/client.ts`)**: React client bindings (`signIn`, `signUp`, `signOut`, `useSession`).
- **Fail-Closed Session Reader (`src/auth/session.ts`)**: `getCurrentUser(req?)` and `requireAuth(req?)` guards adhering strictly to ADR-002 (any error reading sessions resolves to unauthenticated/null, never bypassing access control).
- **API Route Handler (`src/app/api/auth/[...all]/route.ts`)**: Catch-all Next.js endpoint delegating to Better Auth.
- **Calm Authority Auth UI (`src/components/features/auth-form.tsx`)**: Accessible, mobile-responsive auth form adhering to `DESIGN.md` OKLCH tokens, touch targets ≥ 44px, Tier 0 CSS animations, and currency selection (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`).
- **Auth & Dashboard Pages (`src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/dashboard/page.tsx`)**: Login/signup flows with fail-closed redirect for authenticated users, and protected dashboard showing user profile, currency, and sign-out button (`src/components/features/sign-out-button.tsx`).

## 2. Contract & Boundary Types

- **Consumes:** `signUpSchema` / `SignUpInputSchema`, `signInSchema` / `SignInInputSchema` (`src/schemas/auth.ts`)
- **Exposes:**
  - `sessionResponseSchema` / `AuthSessionResponseSchema` (`src/schemas/auth.ts`)
  - HTTP cookies: `subscription_tracker.session_token` (`HttpOnly`, `SameSite=Lax`, 30-day TTL)
  - `getCurrentUser(req?: Request | Headers): Promise<AuthenticatedUser | null>`
  - `requireAuth(req?: Request | Headers): Promise<AuthenticatedUser>`

## 3. Definition of Done & Security Audit

- [x] **Input Validation:** Zod schemas reject short passwords (< 8 characters), malformed emails, and unauthorized currency codes.
- [x] **Password KDF:** Passwords are never stored or logged in plain text; hashed with modern salted KDF in PostgreSQL `account` table.
- [x] **Cookie Security:** Cookie prefixed `subscription_tracker.session_token`, marked `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- [x] **Fail-Closed Guards:** Missing, invalid, or forged session cookies return `null` and redirect protected routes (`/dashboard`) to `/login`.
- [x] **No Secrets in Source:** `BETTER_AUTH_SECRET` read solely through typed config loader (`src/config/loader.ts`).
- [x] **Design Tokens & A11y:** `frontend-audit` verified 18/18 PASS, 0 errors, 0 warnings.
- [x] **Single Responsibility:** Auth engine isolated in `src/auth/`, domain types in `src/domain/`, route handlers in `src/app/api/`.

## 4. How Verified

1. **Integration Tests (`tests/integration/auth.test.ts`):**
   - 12/12 passing automated integration tests against real PostgreSQL 18 container.
   - Verifies user registration, password hash persistence in DB, session issuance, invalid password rejection (401), session verification via headers, fail-closed forgery rejection, and currency persistence.
2. **Unit Tests (`pnpm test`):**
   - 29/29 passing unit tests across config, contracts-pinning, health, and infra.
3. **Frontend Quality Gate (`frontend-audit`):**
   - `python C:\Users\kishore\.gemini\config\skills\frontend-audit\audit.py DESIGN.md src/components/` passed with 0 errors and 0 warnings.
4. **Live Path Browser Verification (`http://localhost:3001`):**
   - Navigated to `/signup`, registered user with `EUR` currency.
   - Redirected to `/dashboard`, confirmed welcome message and account currency `EUR`.
   - Clicked "Sign Out", verified redirect to `/login`.
   - Re-authenticated via `/login` and confirmed session restoration.
   - Verified unauthenticated `GET /dashboard` redirects with HTTP 307 to `/login`.

## Demo account quick-fill (ADHOC-02)

On `/login` a "Use Demo Account" control fills the seeded credentials in one click.
