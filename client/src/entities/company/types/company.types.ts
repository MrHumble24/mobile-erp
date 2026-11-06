export interface CurrencyConfig {
  code: string
  sign: string
  signPosition: "before" | "after"
  decimals: number
}

export interface BrandingView {
  name: string
  logoUrl: string | null
  themeCode: string
  defaultLanguage: string
  currency: CurrencyConfig
}

export interface ThemeView {
  code: string
  name: string
  sortOrder: number
  isActive: boolean
}

export interface CompanyProfileView {
  id: string
  name: string
  legalName: string | null
  logoFile: string | null
  logoUrl: string | null
  address: string | null
  phone: string | null
  country: string
  timeZone: string
  defaultLanguage: string
  currencyCode: string
  currencySign: string
  currencySignPosition: "before" | "after"
  currencyDecimals: number
  themeCode: string
  sessionDuration: string
  themes: ThemeView[]
}

export type CompanyProfile = CompanyProfileView

export interface UpdateCompanyProfileDto {
  name?: string
  legalName?: string
  address?: string
  phone?: string
  country?: string
  timeZone?: string
  defaultLanguage?: string
  currencyCode?: string
  currencySign?: string
  currencySignPosition?: "before" | "after"
  currencyDecimals?: number
  themeCode?: string
  sessionDuration?: string
}

export interface SetupDto {
  code: string
  owner: {
    email: string
    password: string
    firstName: string
    lastName?: string
    phone?: string
  }
  company: {
    name: string
    legalName?: string
    address?: string
    phone?: string
    country?: string
    timeZone?: string
    defaultLanguage?: string
    currencyCode: string
    currencySign: string
    currencySignPosition?: "before" | "after"
    currencyDecimals?: number
    themeCode?: string
  }
  firstStore?: {
    name?: string
    address?: string
    phone?: string
  }
  switches?: {
    discountsEnabled?: boolean
    customerCreditEnabled?: boolean
    shiftsEnabled?: boolean
    repairsEnabled?: boolean
    bonusEnabled?: boolean
    receiptPrintingEnabled?: boolean
  }
  telegram?: {
    botToken?: string
    chatId?: string
  }
}
