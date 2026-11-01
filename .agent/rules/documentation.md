## Documentation — part of the change, never a follow-up

| What                                         | Where                                   |
|----------------------------------------------|-----------------------------------------|
| Requirements / scope changes                 | `docs/PRD.md` (single source of truth)  |
| Architectural or tooling decision            | `docs/decisions/NNNN-slug.md` (ADR)     |
| Module / slice purpose, public API, invariants | `README.md` inside that module or slice |
| How to run / env vars                        | package `README.md`                     |
| Structure & relationships                    | the knowledge graph (`graphify.md`)     |

**ADR format** (≤ 40 lines): `# NNNN — Title`, Date, Status, Context, Decision, Consequences.

**Module/slice README** (≤ 40 lines): what it owns, what it exposes (public API), what it must never do, open questions.

Rules:
- Code and its docs ship in the same change. A PR/commit that changes behaviour without touching docs is incomplete.
- Document *why*, not *what*. No comments narrating code; JSDoc only on non-obvious public functions.
- Stale docs are bugs: delete or fix them when you find them.
- Every agent ends its task report with the list of docs it touched.
