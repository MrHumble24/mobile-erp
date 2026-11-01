## Engineering principles (all agents, all packages)

**DRY — one source of truth per piece of knowledge**
- Before writing any helper, type, constant or validation rule: grep `client/src/shared`, `server/src/common` and the knowledge graph. If it exists, reuse it.
- The second copy of any logic is the signal to extract it. Not the third.
- Business rules (prices, statuses, IMEI format, warranty periods) are defined once and imported everywhere — never re-typed in UI, DTO and service.
- DRY is about knowledge, not text. Two things that look alike but change for different reasons stay separate.

**SOLID**
- **S** — one reason to change per file, class, component, hook. If you need "and" to describe it, split it.
- **O** — add behaviour by adding a file (new strategy, provider, component, Nest module), not by growing a `switch`/`if` chain.
- **L** — a subtype must be a drop-in. No `instanceof` / type-tag branching in callers.
- **I** — narrow interfaces and props. No `props: any`, no "options bag" with 15 optional keys. Split interfaces by consumer.
- **D** — depend on abstractions at boundaries: Nest DI tokens, React props/hooks/context. Never import a concrete singleton (Prisma client, fetch, storage) from business logic.
- SOLID is not a license for ceremony: no interface with a single implementation unless a second one is already in the PRD.

**Separation of concerns**
- Four concerns never share a file: transport (HTTP/UI events), business rules, data access, presentation.
- Server mapping: `server-structure.md`. Client mapping: `client-fsd.md`.
- A function that both fetches and formats, or validates and persists, is two functions.

**Default to less**
- No speculative abstractions, feature flags or config for values that never change.
- Delete dead code when you see it. Boring beats clever.
