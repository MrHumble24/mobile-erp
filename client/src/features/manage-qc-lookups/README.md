# feature: manage-qc-lookups

Runtime management of the two QC lookups — defect types and cosmetic grades —
behind `settings.manage`. `QcLookupsPanel` renders two side-by-side table
panels, each with a create and an edit dialog.

## Behaviour
- Create: `code` auto-fills (UPPER_SNAKE) from the label until the user edits it;
  409 (duplicate code) surfaces as a field error.
- Edit: label, sort order and an active switch. There is no delete — a lookup
  referenced by inspections is deactivated, which hides it from the inspection
  dialog (`useDefectTypes()`/`useGrades()` default to active-only).
- Lists load with `includeInactive=true` so admins see deactivated rows.

## Must never
- Call HTTP directly or hold server data in local state (hooks only).
- Render native form/table controls — use `shared/ui`.
