# 0004 — Agent team: scoped builders in worktrees, read-only guardians, Gemini for Uzbek

Date: 2026-11-01 · Status: accepted

## Context
Several AI agents will build the system in parallel. Unscoped agents edit the same files, drift from the PRD, and nobody owns security review. Uzbek UI copy from Claude reads unnaturally.

## Decision
- Six project agents in `.claude/agents/`: `backend`, `frontend`, `fullstack` (Claude Opus 5.5, each confined to its package(s), each in its own git worktree on `agent/<name>/<slug>`), `prd-guardian` (Sonnet 5.5, read-only scope check with PRD citations), `security-auditor` (Opus 5.5, read-only, run sparingly), Gemini is not a Claude subagent: the user pilots it in Antigravity using handoff docs from `docs/handoffs/gemini/` (shadcn/ui setup, Uzbek copy, UI polish). Antigravity reads `.agent/rules/` so the same rules bind it.
- Repo root is the single git repository (the former empty `server/.git` was removed; it had no commits). Worktrees live under `.worktrees/` (git-ignored).
- Only the user edits PRD, rules and agent definitions; agents propose.

## Consequences
- Parallel work without merge collisions; cross-package needs flow through written contracts.
- Scope drift is caught before and after building; security review has an owner.
- Requires an initial commit on `main` before the first worktree can be created.
