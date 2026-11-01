# Gemini handoffs (Antigravity)

The user pilots Gemini inside Antigravity. Claude agents never call Gemini. When a task needs Gemini
(shadcn/ui work in `shared/ui`, Uzbek copy, UI wording), a Claude agent lists what is needed in its
report and the user pastes a handoff from this folder into Antigravity.

Each handoff file = one paste-ready message between the `=== MESSAGE ===` markers, plus a Result
section Gemini fills in. Antigravity loads `.agent/rules/*.md` automatically, so messages stay short
and point at the rule instead of repeating it.

Numbering: `NNN-slug.md`. Status: `open | done`.
