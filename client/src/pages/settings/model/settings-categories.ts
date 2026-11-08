import type { LucideIcon } from "lucide-react"
import {
  Store,
  Globe,
  Palette,
  SlidersHorizontal,
  Percent,
  Printer,
  CreditCard,
  Coins,
  Calendar,
  Users,
  Wrench,
  ShoppingBag,
  Truck,
  Wallet,
  Send,
} from "lucide-react"

export type SettingsCategory =
  | "identity"
  | "region"
  | "appearance"
  | "sales"
  | "discounts"
  | "printing"
  | "credit"
  | "bonus"
  | "nasiya"
  | "shifts"
  | "repairs"
  | "storefront"
  | "delivery"
  | "payments"
  | "telegram"

export type SettingsGroupKey = "general" | "sales" | "integrations"

export interface SettingsCategoryMeta {
  id: SettingsCategory
  group: SettingsGroupKey
  titleKey: string
  descKey: string
  icon: LucideIcon
  keywords: string[]
}

export const SETTINGS_GROUPS: { key: SettingsGroupKey; labelKey: string }[] = [
  { key: "general", labelKey: "settings.groupGeneral" },
  { key: "sales", labelKey: "settings.groupSales" },
  { key: "integrations", labelKey: "settings.groupIntegrations" },
]

export const SETTINGS_CATEGORIES: SettingsCategoryMeta[] = [
  // General & System
  {
    id: "identity",
    group: "general",
    titleKey: "settings.catIdentity",
    descKey: "settings.catIdentityDesc",
    icon: Store,
    keywords: ["nomi", "logo", "logotip", "brend", "manzil", "telefon", "yuridik", "identity", "store", "footer", "chek"],
  },
  {
    id: "region",
    group: "general",
    titleKey: "settings.catRegion",
    descKey: "settings.catRegionDesc",
    icon: Globe,
    keywords: ["valyuta", "mintaqa", "vaqt", "davlat", "dollar", "usd", "som", "uzs", "timezone", "currency", "region"],
  },
  {
    id: "appearance",
    group: "general",
    titleKey: "settings.catAppearance",
    descKey: "settings.catAppearanceDesc",
    icon: Palette,
    keywords: ["mavzu", "rang", "ko'rinish", "tashqi", "sand", "obsidian", "nord", "theme", "dark", "light"],
  },

  // Sales & Checkout
  {
    id: "sales",
    group: "sales",
    titleKey: "settings.catSales",
    descKey: "settings.catSalesDesc",
    icon: SlidersHorizontal,
    keywords: ["kafolat", "marja", "savdo", "qoldiq", "chegara", "warranty", "margin", "sales"],
  },
  {
    id: "discounts",
    group: "sales",
    titleKey: "settings.catDiscounts",
    descKey: "settings.catDiscountsDesc",
    icon: Percent,
    keywords: ["chegirma", "foiz", "summa", "maksimal", "preset", "discount", "price"],
  },
  {
    id: "printing",
    group: "sales",
    titleKey: "settings.catPrinting",
    descKey: "settings.catPrintingDesc",
    icon: Printer,
    keywords: ["chek", "printer", "chop", "qog'oz", "58mm", "80mm", "narx yorlig'i", "print", "receipt"],
  },
  {
    id: "credit",
    group: "sales",
    titleKey: "settings.catCredit",
    descKey: "settings.catCreditDesc",
    icon: CreditCard,
    keywords: ["kredit", "qarz", "limit", "foizsiz", "credit"],
  },
  {
    id: "bonus",
    group: "sales",
    titleKey: "settings.catBonus",
    descKey: "settings.catBonusDesc",
    icon: Coins,
    keywords: ["bonus", "keshbek", "ball", "sodiqlik", "loyalty", "points"],
  },
  {
    id: "nasiya",
    group: "sales",
    titleKey: "settings.catNasiya",
    descKey: "settings.catNasiyaDesc",
    icon: Calendar,
    keywords: ["nasiya", "muddat", "eslatma", "kun", "sheriklar", "due"],
  },
  {
    id: "shifts",
    group: "sales",
    titleKey: "settings.catShifts",
    descKey: "settings.catShiftsDesc",
    icon: Users,
    keywords: ["smena", "kassa", "kassir", "shift"],
  },
  {
    id: "repairs",
    group: "sales",
    titleKey: "settings.catRepairs",
    descKey: "settings.catRepairsDesc",
    icon: Wrench,
    keywords: ["ta'mirlash", "servis", "usta", "qismlar", "repair"],
  },

  // Integrations & Storefront
  {
    id: "storefront",
    group: "integrations",
    titleKey: "settings.catStorefront",
    descKey: "settings.catStorefrontDesc",
    icon: ShoppingBag,
    keywords: ["vitrina", "onlayn do'kon", "katalog", "veb-sayt", "havola", "storefront", "shop"],
  },
  {
    id: "delivery",
    group: "integrations",
    titleKey: "settings.catDelivery",
    descKey: "settings.catDeliveryDesc",
    icon: Truck,
    keywords: ["yetkazib berish", "olib ketish", "kuryer", "narx", "hudud", "zona", "delivery", "pickup"],
  },
  {
    id: "payments",
    group: "integrations",
    titleKey: "settings.catPayments",
    descKey: "settings.catPaymentsDesc",
    icon: Wallet,
    keywords: ["to'lov", "click", "payme", "merchant", "secret", "payment"],
  },
  {
    id: "telegram",
    group: "integrations",
    titleKey: "settings.catTelegram",
    descKey: "settings.catTelegramDesc",
    icon: Send,
    keywords: ["telegram", "bot", "token", "chat", "guruh", "hisobot", "xabarnoma"],
  },
]
