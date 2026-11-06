import type { SetupDto } from "@/entities/company"
import type { WizardState } from "../ui/steps/types"

export function buildSetupPayload(state: WizardState): SetupDto {
  return {
    code: state.code.trim().toUpperCase(),
    owner: {
      email: state.owner.email.trim().toLowerCase(),
      password: state.owner.password,
      firstName: state.owner.firstName.trim(),
      ...(state.owner.lastName?.trim() ? { lastName: state.owner.lastName.trim() } : {}),
      ...(state.owner.phone?.trim() ? { phone: state.owner.phone.trim() } : {}),
    },
    company: {
      name: state.company.name.trim(),
      currencyCode: state.company.currencyCode.trim().toUpperCase(),
      currencySign: state.company.currencySign.trim(),
      currencySignPosition: state.company.currencySignPosition || "before",
      currencyDecimals: state.company.currencyDecimals ?? 2,
      country: state.company.country?.trim() || "UZ",
      timeZone: state.company.timeZone?.trim() || "Asia/Tashkent",
      defaultLanguage: state.company.defaultLanguage || "uz",
      themeCode: state.company.themeCode || "caldera",
      ...(state.company.legalName?.trim() ? { legalName: state.company.legalName.trim() } : {}),
      ...(state.company.address?.trim() ? { address: state.company.address.trim() } : {}),
      ...(state.company.phone?.trim() ? { phone: state.company.phone.trim() } : {}),
    },
    ...(state.firstStore?.name?.trim()
      ? {
          firstStore: {
            name: state.firstStore.name.trim(),
            ...(state.firstStore.address?.trim() ? { address: state.firstStore.address.trim() } : {}),
            ...(state.firstStore.phone?.trim() ? { phone: state.firstStore.phone.trim() } : {}),
          },
        }
      : {}),
    switches: {
      discountsEnabled: Boolean(state.switches?.discountsEnabled),
      shiftsEnabled: Boolean(state.switches?.shiftsEnabled),
      repairsEnabled: Boolean(state.switches?.repairsEnabled),
      customerCreditEnabled: Boolean(state.switches?.customerCreditEnabled),
      bonusEnabled: Boolean(state.switches?.bonusEnabled),
      receiptPrintingEnabled: Boolean(state.switches?.receiptPrintingEnabled),
    },
    ...(state.telegram?.botToken?.trim() || state.telegram?.chatId?.trim()
      ? {
          telegram: {
            ...(state.telegram.botToken?.trim() ? { botToken: state.telegram.botToken.trim() } : {}),
            ...(state.telegram.chatId?.trim() ? { chatId: state.telegram.chatId.trim() } : {}),
          },
        }
      : {}),
  }
}