# feature: edit-backup-schedule

The daily automatic-backup schedule.

## Owns
- `ScheduleCard` — on/off, time of day, and how many to keep (`keepLast`). Reads the on/off value with `useWatch` (React Compiler) to disable the time field when off.
- `makeScheduleSchema(t)` + `toUpdateDto` — HH:mm time, keepLast 1–365 as a numeric text field converted to a number on submit.
