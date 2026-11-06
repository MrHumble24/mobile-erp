/**
 * The browser origins this server trusts. One source of truth for CORS (main.ts)
 * and the OAuth return-URL allow-list (open-redirect protection, PART 4).
 */
export function corsOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ??
    (process.env.NODE_ENV === 'production'
      ? 'https://luminous-gratitude-production-50bf.up.railway.app'
      : 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174');
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/** This server's own public origin — where OAuth providers redirect the browser
 * back (the address registered with Google/Microsoft). On Railway set
 * `PUBLIC_URL` to the app's URL; in dev it is the server's own port, never the
 * client origin. */
export function publicOrigin(): string {
  const explicit = process.env.PUBLIC_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
