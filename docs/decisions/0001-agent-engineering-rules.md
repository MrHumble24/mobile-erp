# 0001 — Binding engineering rules for AI agents

Date: 2026-11-01 · Status: accepted

## Context
Several AI agents (Claude Code and subagents, plus `.agent/`-reading tools) build this repo in parallel. Without shared, enforced rules they drift into duplicated helpers, giant files and mixed concerns.

## Decision
- Canonical rules live in `.agent/rules/*.md`, one file per concern; root `CLAUDE.md` imports them so every Claude session and subagent loads them.
- Principles: DRY, SOLID, separation of concerns (`principles.md`).
- Structure: Feature-Sliced Design for `client/` (`client-fsd.md`); module anatomy controller/service/repository for `server/` (`server-structure.md`).
- Hard file limit 300 lines, enforced by a PostToolUse hook (`.claude/hooks/check-file-size.sh`) and `max-lines` in eslint/oxlint (`file-size.md`).
- Knowledge graph (graphify) must be read before and updated after code changes (`graphify.md`).
- Docs ship with the code: PRD for scope, ADRs for decisions, README per module/slice (`documentation.md`).

## Consequences
- Agents get blocked mid-edit when a file crosses 300 lines; they must split instead of continue.
- Slightly more files; each one is small and single-purpose.
- Generated code (`server/src/generated`) is exempt from size limits and never hand-edited.
