/**
 * OAuth + API host descriptors for the Google Drive and OneDrive adapters. The
 * hosts are fixed (never from user input); each has an env override so the tests
 * can point a fake HTTP server at it. `drive.file` / `Files.ReadWrite.AppFolder`
 * are the smallest scopes that let the app write its own files.
 */

function host(envKey: string, fallback: string): string {
  return (process.env[envKey]?.trim() || fallback).replace(/\/+$/, '');
}

export interface OAuthSpec {
  consentUrl: string;
  tokenUrl: string;
  scope: string;
  /** Extra params on the consent URL (e.g. Google offline access). */
  consentExtra: Record<string, string>;
  apiBase: string;
}

export function googleSpec(): OAuthSpec {
  return {
    consentUrl: `${host('GOOGLE_AUTH_BASE', 'https://accounts.google.com')}/o/oauth2/v2/auth`,
    tokenUrl: `${host('GOOGLE_TOKEN_BASE', 'https://oauth2.googleapis.com')}/token`,
    scope: 'https://www.googleapis.com/auth/drive.file',
    consentExtra: { access_type: 'offline', prompt: 'consent' },
    apiBase: host('GOOGLE_API_BASE', 'https://www.googleapis.com'),
  };
}

export function microsoftSpec(): OAuthSpec {
  const auth = host('MICROSOFT_AUTH_BASE', 'https://login.microsoftonline.com');
  return {
    consentUrl: `${auth}/common/oauth2/v2.0/authorize`,
    tokenUrl: `${auth}/common/oauth2/v2.0/token`,
    scope: 'Files.ReadWrite.AppFolder offline_access',
    consentExtra: {},
    apiBase: host('MICROSOFT_GRAPH_BASE', 'https://graph.microsoft.com'),
  };
}

export function specFor(code: string): OAuthSpec | null {
  if (code === 'GOOGLE_DRIVE') return googleSpec();
  if (code === 'ONEDRIVE') return microsoftSpec();
  return null;
}
