import { z } from "zod"
import type { UpdateSettingsDto } from "@/entities/backup"

type T = (key: string, params?: Record<string, string | number>) => string

export function makeScheduleSchema(t: T) {
  return z.object({
    scheduleEnabled: z.boolean(),
    scheduleTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, t("backups.scheduleTimeInvalid")),
    // Numeric text field (react-hook-form inputs are strings), ranged like the
    // server's UpdateBackupSettingsDto; converted to a number on submit.
    keepLast: z.string().refine(
      (v) => {
        const n = Number(v)
        return Number.isInteger(n) && n >= 1 && n <= 365
      },
      { message: t("backups.keepLastInvalid") },
    ),
  })
}

export type ScheduleValues = z.infer<ReturnType<typeof makeScheduleSchema>>

export function toUpdateDto(values: ScheduleValues): UpdateSettingsDto {
  return {
    scheduleEnabled: values.scheduleEnabled,
    scheduleTime: values.scheduleTime,
    keepLast: Number(values.keepLast),
  }
}
