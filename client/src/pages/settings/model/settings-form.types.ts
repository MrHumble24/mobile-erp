import type { UseFormReturn } from "react-hook-form"
import type { SettingsValues } from "./settings-schema"

/** The settings form instance shared by every section. */
export type SettingsForm = UseFormReturn<SettingsValues>

/** Keys of SettingsValues whose value is a string (the text/number fields). */
export type StringFieldName = {
  [K in keyof SettingsValues]: SettingsValues[K] extends string ? K : never
}[keyof SettingsValues]

/** Keys of SettingsValues whose value is a boolean (the switch fields). */
export type BooleanFieldName = {
  [K in keyof SettingsValues]: SettingsValues[K] extends boolean ? K : never
}[keyof SettingsValues]
