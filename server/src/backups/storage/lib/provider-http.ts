/** Shared HTTP helpers for the remote storage adapters. All calls go to fixed
 * hosts (never an address from user input); errors carry no secrets; every
 * request is bounded by an AbortController timeout so a stalled place fails
 * fast instead of holding the backup lock open (serious fix 1). */

/** A place could not be reached or refused the request. */
export class ProviderError extends Error {}

/** The login was revoked or expired — the place needs reconnecting. */
export class ProviderAuthError extends ProviderError {}

/** Per-request timeout (one API call / one chunk); env-overridable for tests. */
export function requestTimeoutMs(): number {
  return Number(process.env.BACKUP_HTTP_TIMEOUT_MS) || 30_000;
}

/** Larger bound for a single uploaded chunk (which carries real bytes). */
export function chunkTimeoutMs(): number {
  return Number(process.env.BACKUP_CHUNK_TIMEOUT_MS) || 120_000;
}

/** Whole-operation bound for one place's upload/download/delete. */
export function placeTimeoutMs(): number {
  return Number(process.env.BACKUP_PLACE_TIMEOUT_MS) || 30 * 60_000;
}

function isAuthStatus(status: number): boolean {
  return status === 401 || status === 403;
}

/** `fetch` with an AbortController timeout. A stalled connection rejects. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms: number = requestTimeoutMs(),
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted)
      throw new ProviderError(`Request timed out after ${ms}ms`);
    throw err instanceof Error ? err : new ProviderError(String(err));
  } finally {
    clearTimeout(timer);
  }
}

/** Reject if `promise` does not settle within `ms` (bounds a whole place op). */
export async function withDeadline<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: NodeJS.Timeout;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new ProviderError(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  try {
    return await Promise.race([promise, deadline]);
  } finally {
    clearTimeout(timer!);
  }
}

/** Fetch JSON, throwing a clean ProviderError / ProviderAuthError on non-2xx. */
export async function fetchJson<T>(
  label: string,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetchWithTimeout(url, init);
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
