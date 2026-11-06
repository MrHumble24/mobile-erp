/** Non-secret settings stored in `backup_provider_configs.config`. */
export interface TelegramSettings {
  chatId?: string;
}

export interface OAuthSettings {
  folderId?: string;
  folderName?: string;
  accountName?: string;
  accountEmail?: string;
}

export type ProviderConfigJson = TelegramSettings & OAuthSettings;

/** One place, as the manage screen sees it. No secrets — only their presence. */
export interface PlaceView {
  code: string;
  label: string;
  /** An adapter for this provider is registered on this server. */
  available: boolean;
  /** The secrets it needs (bot token, or OAuth client id + secret) are present. */
  configured: boolean;
  /** A login/connection is in place (Telegram chat id set; OAuth refresh token). */
  connected: boolean;
  enabled: boolean;
  status: string; // OK | NEEDS_RECONNECT | ERROR | NEVER_USED
  lastSuccessAt: Date | null;
  lastError: string | null;
  capabilities: {
    list: boolean;
    download: boolean;
    delete: boolean;
    maxPartBytes: number | null;
  };
  /** Non-secret settings (chat id, connected account, folder name). */
  settings: ProviderConfigJson;
  /** Whether LOCAL — always on, cannot be switched off. */
  locked: boolean;
}
