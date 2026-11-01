## No god files — hard limits

| Unit                         | Limit            | Enforced by                              |
|------------------------------|------------------|------------------------------------------|
| Any source file              | **300 lines**    | `.claude/hooks/check-file-size.sh` (blocks the edit), `max-lines` in eslint + oxlint |
| Function / method            | 50 lines (warn)  | `max-lines-per-function`                 |
| React component file         | one exported component | review                             |
| Nest controller              | one resource     | review                                   |

- Approaching 250 lines? Split **now**, by responsibility, not by "part1/part2".
- Exempt (generated or data, never hand-edited): `**/generated/**`, `**/graphify-out/**`, lockfiles, `*.json`, `*.md`, `*.svg`, `*.prisma`, `**/migrations/**`.
- The limit is not a target. A 40-line file with one job is the norm.
- Barrel `index.ts` files only re-export; they contain no logic.
