# features/auth

Owns user authentication flows: credentials login, session state persistence, and session termination (logout).

## Exposes (public API via index.ts)

- `useAuthStore` — Zustand store for JWT shift token, user profile, and permission checks.
- `useLogin` — React Query mutation hook for user credentials authentication.
- `useSessionRefresh` — Re-reads `/auth/me` on app load (mounted in the route guard) so permissions granted after sign-in apply without a re-login.
- `useLogout` — Hook performing session cleanup, QueryClient cache wipe, draft resets, and redirect.
- `LoginForm` — Credentials login form with schema validation.
- `LogoutConfirmDialog` — Accessible modal dialog prompting user confirmation before logging out.
- `authRepository` — HTTP transport for `/auth/login` and `/auth/me`.

## Invariants & Rules

- Token payload contains `{ sub, email }` only; permissions are never embedded in the token (ADR 0005).
- Logout is client-authoritative: clears Zustand session, resets React Query cache, and redirects to `/login`.
- Never import other features directly; cross-feature coordination is done one layer up in widgets.

