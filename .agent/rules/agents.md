## Agent team — ownership, isolation, hand-offs

| Agent              | Model             | Owns / may edit                           | When                                   |
|--------------------|-------------------|-------------------------------------------|----------------------------------------|
| `backend`          | Claude Opus 5.5   | `server/**`                               | Any server task                        |
| `frontend`         | Claude Opus 5.5   | `client/**`                               | Any web client task                    |
| `fullstack`        | Claude Opus 5.5   | `server/**` + `client/**`                 | On demand, vertical slices only        |
| `prd-guardian`     | Claude Sonnet 5.5 | nothing (read-only)                       | Before a builder starts; before merge  |
| `security-auditor` | Claude Opus 5.5   | nothing (read-only + scanners)            | Sparingly: pre-release, after auth/sync changes |
| `gemini-ui-uz`     | Sonnet 5.5 + Gemini CLI | `client/src/shared/i18n/**`, UI strings | After frontend work; Uzbek copy, UI wording |

**No overlap.** One agent per package per task. A builder that needs the other side writes the contract in its report and stops. Two builders never touch the same file in the same task.

**Isolation.** Every builder runs in its own git worktree on branch `agent/<agent>/<task-slug>` (spawn with `isolation: "worktree"`, or `git worktree add .worktrees/<agent>-<slug> -b agent/<agent>/<slug>`). `main` only receives reviewed merges. `git add` only the paths you changed.

**Flow for a feature.**
1. `prd-guardian` checks the task → IN_SCOPE, or the user decides on GAP/DEVIATION.
2. `backend` and/or `frontend` build in parallel worktrees (or `fullstack` on demand).
3. `gemini-ui-uz` adds Uzbek copy / polishes wording.
4. `prd-guardian` re-checks the diff; `security-auditor` when auth, permissions, sync or money paths changed.
5. Merge.

**Only the user edits** `docs/PRD.md`, `.agent/rules/*`, `.claude/*`. Agents propose changes in their reports.

**Models.** Builders and the auditor run Claude Opus 5.5. The guardian and the Gemini driver run Sonnet 5.5 (read-heavy, cheap). Uzbek and UI copy come from Gemini via the `gemini` CLI; Claude never hand-writes Uzbek.
