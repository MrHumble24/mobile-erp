## client/ — mandatory tech stack and where each piece lives

| Concern                 | Tool                                   | Lives in (FSD)                                              |
|-------------------------|----------------------------------------|-------------------------------------------------------------|
| Routing                 | **React Router**                       | `app/router/` (route table, guards, layouts); `pages/*`      |
| Server state            | **React Query** (+ Devtools in dev)    | `app/providers/query-provider.tsx`; hooks in `*/model/`      |
| Data access             | **Repository / service layer**         | `shared/api/http.ts`; `entities/<x>/api/<x>.repository.ts`   |
| Client state            | **Zustand**                            | `<slice>/model/<name>.store.ts`                              |
| Reusable logic          | **Custom hooks**                       | `<slice>/model/use-<thing>.ts`; stack-level in `shared/lib/`  |

**Server state = React Query only**
- Every read is `useQuery`, every write is `useMutation`. No `useEffect` + fetch, no server data in `useState` or Zustand.
- Query keys come from one factory per entity: `entities/<x>/api/<x>.keys.ts` (`deviceKeys.list(filters)`, `deviceKeys.detail(id)`). Never hand-write key arrays in components.
- Mutations invalidate via the key factory. Optimistic updates live in the mutation hook, not the component.
- One `QueryClient` created in `app/providers`; defaults (staleTime, retry) set there and nowhere else. `ReactQueryDevtools` mounted there, dev builds only.

**Repository layer = the only place that talks HTTP**
- `shared/api/http.ts`: one configured client (base URL, auth header, error normalization). The only file that imports `fetch`/axios.
- `entities/<x>/api/<x>.repository.ts`: plain async functions, no React. Call `http`, map DTO → domain type, return domain. One repository per entity.
- `features/<x>/api/` repositories only for action-specific endpoints (e.g. `checkout.repository.ts`).
- Components and stores never import a repository. Only hooks do.

**Custom hooks = the component's only door to data**
- `entities/<x>/model/use-<x>.ts` wraps `useQuery`/`useMutation` around the repository. Components call `useDevices(filters)`, never `useQuery` directly.
- A hook does one thing. "use-checkout" that also fetches customers is two hooks.
- Hooks that are stack-level (debounce, local storage, media query) go to `shared/lib/hooks/`.

**Zustand = client-only state**
- Allowed: UI mode, drafts (cart in progress), scanner settings, filters, session/auth token. Forbidden: anything the server owns.
- One store per concern, in the slice that owns it: `features/checkout/model/cart.store.ts`. No single global `app.store.ts`.
- Components subscribe with selectors (`useCartStore(s => s.items)`), never the whole store.
- Actions live inside the store; components never `setState` directly.
- Persist middleware only for state the PRD says survives reload (offline drafts).

**Routing**
- Route table in `app/router/routes.tsx`; each route lazy-loads a `pages/*` component.
- Route params and search params are read in `pages/` (or a page-level hook) and passed down as props. Entities and features do not know about the URL.
- Role guards (Admin / Cashier / QC) are a layout route in `app/router/`, driven by the auth store.

**Forbidden in client code**
- `fetch`/axios outside `shared/api/http.ts`.
- `useQuery`/`useMutation` outside `*/model/use-*.ts` hooks.
- Zustand holding lists of devices, sales, partners or any server entity.
- Prop-drilling server data more than two levels — use the hook where the data is needed; React Query dedupes.

**UI components = shadcn/ui only (no native form controls)**
- shadcn/ui is installed into `shared/ui/` (configure `components.json` aliases to `@/shared/ui`, `@/shared/lib/utils`). It is the design system; Tailwind tokens live in `app/styles`.
- Never render `<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>`, `<table>` or `<a>` for navigation directly in `pages/ widgets/ features/ entities/`. Use `Button`, `Input`, `Select`, `Textarea`, `Dialog`, `Table`, `Form`, `Link` from `shared/ui`.
- Need a component shadcn does not ship? Compose it from shadcn primitives inside `shared/ui/<name>/`. Only there may a native element appear, wrapped once.
- Do not edit generated shadcn files for one-off styling; pass `className`/`variant`. New variants are added to the component's `cva` config in `shared/ui`.
- Forms use shadcn `Form` + `react-hook-form` + `zod` schemas placed in the slice's `model/`.
- Icons: `lucide-react` only, via shadcn conventions.
- Linter enforces this: `react/forbid-elements` in `.oxlintrc.json` (allowed only under `shared/ui/**`).
- **Pre-built Component Kit**: All base Caldera components are ready in `@/shared/ui` (documented in `docs/COMPONENTS.md`). Agents may freely use, extend, or modify them as feature requirements evolve.
