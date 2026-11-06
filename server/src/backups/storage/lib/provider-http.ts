/** Shared HTTP helpers for the remote storage adapters. All calls go to fixed
 * hosts (never an address from user input); errors carry no secrets. */

/** A place could not be reached or refused the request. */
export class ProviderError extends Error {}

/** The login was revoked or expired — the place needs reconnecting. */
export class ProviderAuthError extends ProviderError {}

function isAuthStatus(status: number): boolean {
  return status === 401 || status === 403;
}

/** Fetch JSON, throwing a clean ProviderError / ProviderAuthError on non-2xx. */
export async function fetchJson<T>(
  label: string,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await safeText(res);
    const msg = `${label} failed (${res.status})${body ? `: ${body}` : ''}`;
    throw isAuthStatus(res.status)
      ? new ProviderAuthError(msg)
      : new ProviderError(msg);
  }
  return (await res.json()) as T;
}

/** The provider's error text, trimmed and truncated; never request secrets. */
async function safeText(res: Response): Promise<string> {
  try {
    const text = (await res.text()).trim();
    // Response bodies carry the provider's own error, not our tokens.
    return text.slice(0, 300);
  } catch {
    return '';
  }
}

/** Run `fn`, retrying a few times with back-off on a transient failure. Auth
 * failures are not retried (they will not fix themselves). */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { tries?: number; baseMs?: number } = {},
): Promise<T> {
  const tries = opts.tries ?? 3;
  const base = opts.baseMs ?? 50;
  let lastErr: unknown;
  for (let i = 0; i < tries; i += 1) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof ProviderAuthError) throw err;
      lastErr = err;
      if (i < tries - 1) await sleep(base * 2 ** i);
    }
  }
  throw lastErr instanceof Error ? lastErr : new ProviderError(String(lastErr));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
