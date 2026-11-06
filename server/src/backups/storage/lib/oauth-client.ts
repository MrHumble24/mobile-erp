import { createHash, randomBytes } from 'node:crypto';
import {
  fetchJson,
  ProviderAuthError,
  ProviderError,
} from './provider-http.js';
import type { OAuthSpec } from './oauth-providers.js';

/** The standard OAuth2 authorization-code flow with PKCE, shared by Google and
 * Microsoft. Token requests are form-encoded; both return `access_token` and
 * (with offline access) a `refresh_token`. */

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface Pkce {
  verifier: string;
  challenge: string;
}

export function makePkce(): Pkce {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function buildConsentUrl(
  spec: OAuthSpec,
  p: {
    clientId: string;
    redirectUri: string;
    state: string;
    codeChallenge: string;
  },
): string {
  const url = new URL(spec.consentUrl);
  const params: Record<string, string> = {
    client_id: p.clientId,
    redirect_uri: p.redirectUri,
    response_type: 'code',
    scope: spec.scope,
    state: p.state,
    code_challenge: p.codeChallenge,
    code_challenge_method: 'S256',
    ...spec.consentExtra,
  };
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

function toTokens(r: TokenResponse): Tokens {
  return {
    accessToken: r.access_token,
    refreshToken: r.refresh_token,
    expiresIn: r.expires_in,
  };
}

export async function exchangeCode(
  spec: OAuthSpec,
  p: {
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri: string;
    codeVerifier: string;
  },
): Promise<Tokens> {
  const body = new URLSearchParams({
    client_id: p.clientId,
    client_secret: p.clientSecret,
    code: p.code,
    redirect_uri: p.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: p.codeVerifier,
  });
  return toTokens(
    await fetchJson<TokenResponse>('OAuth token exchange', spec.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }),
  );
}

export async function refreshAccessToken(
  spec: OAuthSpec,
  p: { clientId: string; clientSecret: string; refreshToken: string },
): Promise<Tokens> {
  const body = new URLSearchParams({
    client_id: p.clientId,
    client_secret: p.clientSecret,
    refresh_token: p.refreshToken,
    grant_type: 'refresh_token',
    scope: spec.scope,
  });
  try {
    return toTokens(
      await fetchJson<TokenResponse>('OAuth token refresh', spec.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      }),
    );
  } catch (err) {
    // A revoked/expired refresh token is `invalid_grant` (often HTTP 400) — the
    // place needs reconnecting, not a retry.
    if (err instanceof ProviderError && /invalid_grant/i.test(err.message)) {
      throw new ProviderAuthError('The login was revoked or expired');
    }
    throw err;
  }
}
