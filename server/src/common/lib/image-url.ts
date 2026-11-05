/**
 * The public, read-only prefix product pictures are served from (ADR 0031).
 * `main.ts` mounts UPLOADS_DIR here with a long cache and `nosniff`; an `<img>`
 * fetches it with no token. One source of truth so the device-model mapper and
 * the offline changes feed build the same URL.
 */
export const IMAGE_URL_PREFIX = '/uploads';

/** Relative URL for a stored picture, or null when the model has none. */
export function buildImageUrl(fileName: string | null): string | null {
  return fileName ? `${IMAGE_URL_PREFIX}/${fileName}` : null;
}
