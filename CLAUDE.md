# mobile-erp — Agent Contract

Local-first ERP/POS for a phone retailer (Malika Bazaar, Tashkent). Requirements: `docs/PRD.md`.

| Package   | Stack                                   | Lint / test                         |
|-----------|-----------------------------------------|-------------------------------------|
| `server/` | NestJS 11, Prisma 7 (Postgres), Jest     | `pnpm lint`, `pnpm test`            |
| `client/` | React 19, Vite 8, TS, React Router, React Query, Zustand, oxlint | `pnpm lint`, `pnpm build`           |
| `mobile/` | not started — general rules apply        | —                                   |

## Rules (binding for every agent and subagent)

@.agent/rules/principles.md
@.agent/rules/file-size.md
@.agent/rules/client-fsd.md
@.agent/rules/client-stack.md
@.agent/rules/server-structure.md
@.agent/rules/database.md
@.agent/rules/documentation.md
@.agent/rules/graphify.md
@.agent/rules/agents.md

## Agents
Defined in `.claude/agents/`: `backend`, `frontend`, `fullstack` (Opus 5.5 builders, own worktrees), `prd-guardian`, `security-auditor` (read-only), `gemini-ui-uz` (Uzbek copy via Gemini CLI). Ownership and flow: `.agent/rules/agents.md`.

## Definition of done — every task, no exceptions

1. **Before coding**: read `graphify-out/GRAPH_REPORT.md` (or `graphify query "<question>"`) and grep for an existing helper before writing a new one.
2. **Code** obeys every rule above. The `check-file-size` hook rejects any source file over 300 lines; split it, do not argue with it.
3. **Lint passes** in every package you touched.
4. **Docs updated** in the same change (module README / ADR / PRD) — see documentation.md.
5. **Graph updated**: run `graphify update .` in each package you changed, then at the repo root.
6. Report: what changed, which rules forced a split or an extraction, what was deliberately left out.

Never: `git add -A`, editing `server/src/generated/**` by hand, committing `.env`.
