# OpenCode handoffs

The user runs OpenCode. Claude writes the task here; OpenCode builds it; Claude checks and merges.
Added on 2026-11-05 to save Claude tokens (the user's decision).

Each file = one paste-ready message between the `=== MESSAGE ===` markers, plus a Result section
OpenCode fills in. Numbering: `NNN-slug.md`. Status: `open | building | done | merged`.

How to run one:
1. From the repo root: `git worktree add .worktrees/opencode-<slug> -b agent/opencode/<slug> main`
2. `cd .worktrees/opencode-<slug> && opencode`, then paste the message.
3. When it reports, tell Claude "handoff NNN is done". Claude runs the build and tests, reads the
   diff, and merges or sends it back.

Rules that never change (every message repeats the short form):
- Read `CLAUDE.md` and every file in `.agent/rules/` before writing code. They are binding.
- Work only in your worktree, on your branch. Never commit to `main`, never push.
- A dev server runs on port 3000 and a Vite server on 5173. Never stop a process you did not start.
- Never `git add -A`. Never commit `.env`. Never edit `docs/PRD.md`, `.agent/rules/*`, `.claude/*`.
- Never write Uzbek. New interface text is English in both `en` and `uz` files; Gemini translates.
- Never edit a migration that has been applied. Need a change? Add a new migration.
- Report only what you ran. Paste real command output. If something failed or was skipped, say so.
