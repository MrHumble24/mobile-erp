export interface OnlinePaymentProviderConfig {
  providerCode: string
  label: string
  isEnabled: boolean
  isTestMode: boolean
  allowedIps: string[] | null
  settings: Record<string, unknown>
  secretStatus: "set" | "missing" | "unreadable"
}

export interface UpdateProviderConfigDto {
  isEnabled?: boolean
  isTestMode?: boolean
  allowedIps?: string[] | null
  settings?: Record<string, unknown>
}
