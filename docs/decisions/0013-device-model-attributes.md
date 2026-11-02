# 0013 — Per-device-model attribute schema

Date: 2026-11-02
Status: Accepted

## Context

Device `specs` are open-ended JSONB, but intake and edit used a fixed
storage/color/ram UI and no server validation — nothing stopped a typo'd key or
an out-of-range value, and different models need different spec fields.

## Decision

- `DeviceModel.attributes` is a JSONB `AttributeDef[]`
  (`{ key, label, type: text|number|select, options, required, sortOrder }`),
  defaulting to `[]`. One source of truth in
  `device-models/lib/attribute-schema.ts` (`normalizeAttributes`, `validateSpecs`).
- Keys are slugified to `[a-z][a-zA-Z0-9]*` and unique; select options are
  trimmed/deduped. The reserved `storage` key is always a `select` and is
  injected if absent — reports and stock-alert rules group on
  `specs->>'storage'`, so it must exist and never change type.
- Intake (`ShipmentsService`) and edit (`DevicesService`) validate each unit's
  specs strictly against the model schema: unknown keys, missing required
  values, bad select/number values → `400 { message: 'Invalid specs', problems }`.
  The `HttpExceptionFilter` passes thrower-supplied extra fields (`problems`)
  through while keeping the `{ statusCode, message, error }` base.
- Legacy models (empty schema) accept any specs, so the additive migration does
  not break existing inventory.

## Consequences

- New spec fields are an admin data change (edit the model), not a migration.
- Clients fetch the schema (`GET /device-models/:id/attributes`, or inline on
  the model) and render dynamic forms; field-level errors map by `problems.key`.
- A `select` with no configured options accepts any value (unconfigured), so an
  admin must add options to actually constrain intake.
