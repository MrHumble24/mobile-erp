import type { SetupDto } from "@/entities/company"

export interface WizardState extends SetupDto {
  step: number
}

export type WizardUpdate = (updater: (prev: WizardState) => WizardState) => void
