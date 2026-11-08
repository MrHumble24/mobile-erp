import { create } from "zustand"
import uzAuth from "./uz/auth.json"
import uzBackups from "./uz/backups.json"
import uzBalance from "./uz/balance.json"
import uzCatalog from "./uz/catalog.json"
import uzCommon from "./uz/common.json"
import uzConsignments from "./uz/consignments.json"
import uzCredit from "./uz/credit.json"
import uzCustoms from "./uz/customs.json"
import uzCustomers from "./uz/customers.json"
import uzDashboard from "./uz/dashboard.json"
import uzExpenses from "./uz/expenses.json"
import uzInventory from "./uz/inventory.json"
import uzNav from "./uz/nav.json"
import uzPartners from "./uz/partners.json"
import uzPos from "./uz/pos.json"
import uzPricing from "./uz/pricing.json"
import uzPurchases from "./uz/purchases.json"
import uzQc from "./uz/qc.json"
import uzReports from "./uz/reports.json"
import uzRepairs from "./uz/repairs.json"
import uzSales from "./uz/sales.json"
import uzSettings from "./uz/settings.json"
import uzSetup from "./uz/setup.json"
import uzShifts from "./uz/shifts.json"
import uzShipments from "./uz/shipments.json"
import uzStores from "./uz/stores.json"
import uzSync from "./uz/sync.json"
import uzTransfers from "./uz/transfers.json"
import uzUsers from "./uz/users.json"
import uzStorefront from "./uz/storefront.json"
import uzOrders from "./uz/orders.json"
import uzPwa from "./uz/pwa.json"

import enAuth from "./en/auth.json"
import enBackups from "./en/backups.json"
import enBalance from "./en/balance.json"
import enCatalog from "./en/catalog.json"
import enCommon from "./en/common.json"
import enConsignments from "./en/consignments.json"
import enCredit from "./en/credit.json"
import enCustoms from "./en/customs.json"
import enCustomers from "./en/customers.json"
import enDashboard from "./en/dashboard.json"
import enExpenses from "./en/expenses.json"
import enInventory from "./en/inventory.json"
import enNav from "./en/nav.json"
import enPartners from "./en/partners.json"
import enPos from "./en/pos.json"
import enPricing from "./en/pricing.json"
import enPurchases from "./en/purchases.json"
import enQc from "./en/qc.json"
import enReports from "./en/reports.json"
import enRepairs from "./en/repairs.json"
import enSales from "./en/sales.json"
import enSettings from "./en/settings.json"
import enSetup from "./en/setup.json"
import enShifts from "./en/shifts.json"
import enShipments from "./en/shipments.json"
import enStores from "./en/stores.json"
import enSync from "./en/sync.json"
import enTransfers from "./en/transfers.json"
import enUsers from "./en/users.json"
import enStorefront from "./en/storefront.json"
import enOrders from "./en/orders.json"
import enPwa from "./en/pwa.json"

import ruAuth from "./ru/auth.json"
import ruBackups from "./ru/backups.json"
import ruBalance from "./ru/balance.json"
import ruCatalog from "./ru/catalog.json"
import ruCommon from "./ru/common.json"
import ruConsignments from "./ru/consignments.json"
import ruCredit from "./ru/credit.json"
import ruCustoms from "./ru/customs.json"
import ruCustomers from "./ru/customers.json"
import ruDashboard from "./ru/dashboard.json"
import ruExpenses from "./ru/expenses.json"
import ruInventory from "./ru/inventory.json"
import ruNav from "./ru/nav.json"
import ruPartners from "./ru/partners.json"
import ruPos from "./ru/pos.json"
import ruPricing from "./ru/pricing.json"
import ruPurchases from "./ru/purchases.json"
import ruQc from "./ru/qc.json"
import ruReports from "./ru/reports.json"
import ruRepairs from "./ru/repairs.json"
import ruSales from "./ru/sales.json"
import ruSettings from "./ru/settings.json"
import ruSetup from "./ru/setup.json"
import ruShifts from "./ru/shifts.json"
import ruShipments from "./ru/shipments.json"
import ruStores from "./ru/stores.json"
import ruSync from "./ru/sync.json"
import ruTransfers from "./ru/transfers.json"
import ruUsers from "./ru/users.json"
import ruStorefront from "./ru/storefront.json"
import ruOrders from "./ru/orders.json"
import ruPwa from "./ru/pwa.json"

export type Locale = "uz" | "en" | "ru"

const translations: Record<Locale, Record<string, Record<string, string>>> = {
  uz: {
    auth: uzAuth,
    backups: uzBackups,
    balance: uzBalance,
    catalog: uzCatalog,
    common: uzCommon,
    consignments: uzConsignments,
    credit: uzCredit,
    customs: uzCustoms,
    customers: uzCustomers,
    dashboard: uzDashboard,
    expenses: uzExpenses,
    inventory: uzInventory,
    nav: uzNav,
    partners: uzPartners,
    pos: uzPos,
    pricing: uzPricing,
    purchases: uzPurchases,
    qc: uzQc,
    reports: uzReports,
    repairs: uzRepairs,
    sales: uzSales,
    settings: uzSettings,
    setup: uzSetup,
    shifts: uzShifts,
    shipments: uzShipments,
    stores: uzStores,
    sync: uzSync,
    transfers: uzTransfers,
    users: uzUsers,
    storefront: uzStorefront,
    orders: uzOrders,
    pwa: uzPwa,
  },
  en: {
    auth: enAuth,
    backups: enBackups,
    balance: enBalance,
    catalog: enCatalog,
    common: enCommon,
    consignments: enConsignments,
    credit: enCredit,
    customs: enCustoms,
    customers: enCustomers,
    dashboard: enDashboard,
    expenses: enExpenses,
    inventory: enInventory,
    nav: enNav,
    partners: enPartners,
    pos: enPos,
    pricing: enPricing,
    purchases: enPurchases,
    qc: enQc,
    reports: enReports,
    repairs: enRepairs,
    sales: enSales,
    settings: enSettings,
    setup: enSetup,
    shifts: enShifts,
    shipments: enShipments,
    stores: enStores,
    sync: enSync,
    transfers: enTransfers,
    users: enUsers,
    storefront: enStorefront,
    orders: enOrders,
    pwa: enPwa,
  },
  ru: {
    auth: ruAuth,
    backups: ruBackups,
    balance: ruBalance,
    catalog: ruCatalog,
    common: ruCommon,
    consignments: ruConsignments,
    credit: ruCredit,
    customs: ruCustoms,
    customers: ruCustomers,
    dashboard: ruDashboard,
    expenses: ruExpenses,
    inventory: ruInventory,
    nav: ruNav,
    partners: ruPartners,
    pos: ruPos,
    pricing: ruPricing,
    purchases: ruPurchases,
    qc: ruQc,
    reports: ruReports,
    repairs: ruRepairs,
    sales: ruSales,
    settings: ruSettings,
    setup: ruSetup,
    shifts: ruShifts,
    shipments: ruShipments,
    stores: ruStores,
    sync: ruSync,
    transfers: ruTransfers,
    users: ruUsers,
    storefront: ruStorefront,
    orders: ruOrders,
    pwa: ruPwa,
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
  const bundle = translations[locale]?.[namespace] || translations.uz[namespace] || translations.en[namespace]
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
