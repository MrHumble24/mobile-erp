import { create } from "zustand"
import uzAuth from "./uz/auth.json"
import uzCommon from "./uz/common.json"
import uzConsignments from "./uz/consignments.json"
import uzCustomers from "./uz/customers.json"
import uzDashboard from "./uz/dashboard.json"
import uzExpenses from "./uz/expenses.json"
import uzInventory from "./uz/inventory.json"
import uzNav from "./uz/nav.json"
import uzPartners from "./uz/partners.json"
import uzPos from "./uz/pos.json"
import uzQc from "./uz/qc.json"
import uzReports from "./uz/reports.json"
import uzSales from "./uz/sales.json"
import uzSettings from "./uz/settings.json"
import uzShipments from "./uz/shipments.json"
import uzUsers from "./uz/users.json"

import enAuth from "./en/auth.json"
import enCommon from "./en/common.json"
import enConsignments from "./en/consignments.json"
import enCustomers from "./en/customers.json"
import enDashboard from "./en/dashboard.json"
import enExpenses from "./en/expenses.json"
import enInventory from "./en/inventory.json"
import enNav from "./en/nav.json"
import enPartners from "./en/partners.json"
import enPos from "./en/pos.json"
import enQc from "./en/qc.json"
import enReports from "./en/reports.json"
import enSales from "./en/sales.json"
import enSettings from "./en/settings.json"
import enShipments from "./en/shipments.json"
import enUsers from "./en/users.json"

export type Locale = "uz" | "en"

const translations: Record<Locale, Record<string, Record<string, string>>> = {
  uz: {
    auth: uzAuth,
    common: uzCommon,
    consignments: uzConsignments,
    customers: uzCustomers,
    dashboard: uzDashboard,
    expenses: uzExpenses,
    inventory: uzInventory,
    nav: uzNav,
    partners: uzPartners,
    pos: uzPos,
    qc: uzQc,
    reports: uzReports,
    sales: uzSales,
    settings: uzSettings,
    shipments: uzShipments,
    users: uzUsers,
  },
  en: {
    auth: enAuth,
    common: enCommon,
    consignments: enConsignments,
    customers: enCustomers,
    dashboard: enDashboard,
    expenses: enExpenses,
    inventory: enInventory,
    nav: enNav,
    partners: enPartners,
    pos: enPos,
    qc: enQc,
    reports: enReports,
    sales: enSales,
    settings: enSettings,
    shipments: enShipments,
    users: enUsers,
  },
}

interface I18nState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useI18nStore = create<I18nState>((set) => ({
  locale: "uz",
  setLocale: (locale) => set({ locale }),
}))

export function formatString(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return Object.entries(params).reduce((acc, [key, val]) => {
    return acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(val))
  }, template)
}

export function translate(key: string, locale: Locale = "uz", params?: Record<string, string | number>): string {
  const parts = key.split(".")
  if (parts.length < 2) return key
  const [namespace, stringKey] = parts
  const bundle = translations[locale]?.[namespace] || translations.uz[namespace]
  const text = bundle?.[stringKey] ?? key
  return formatString(text, params)
}

export function useI18n() {
  const locale = useI18nStore((s) => s.locale)
  const setLocale = useI18nStore((s) => s.setLocale)

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(key, locale, params)
  }

  return { t, locale, setLocale }
}

export const t = (key: string, params?: Record<string, string | number>) => {
  return translate(key, useI18nStore.getState().locale, params)
}
