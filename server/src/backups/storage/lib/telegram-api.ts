import { fetchJson, ProviderError } from './provider-http.js';

/** Thin Telegram Bot API client for backups. Fixed host (env override for
 * tests). The backup chat is its own private chat/channel, not staff chat. */

function base(): string {
  return (
    process.env.TELEGRAM_API_BASE?.trim() || 'https://api.telegram.org'
  ).replace(/\/+$/, '');
}

interface TgResult<T> {
  ok: boolean;
  result: T;
}

export async function sendMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<void> {
  await fetchJson<TgResult<unknown>>(
    'Telegram sendMessage',
    `${base()}/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    },
  );
}

/** Send one document (a backup part); returns its file_id for later fetching. */
export async function sendDocument(
  token: string,
  chatId: string,
  part: Buffer,
  filename: string,
  caption: string,
): Promise<string> {
  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('caption', caption);
  form.append('document', new Blob([new Uint8Array(part)]), filename);
  const res = await fetchJson<TgResult<{ document?: { file_id: string } }>>(
    'Telegram sendDocument',
    `${base()}/bot${token}/sendDocument`,
    { method: 'POST', body: form },
  );
  const id = res.result.document?.file_id;
  if (!id) throw new ProviderError('Telegram sendDocument returned no file id');
  return id;
}

/** Fetch a document's bytes back (getFile → download). Each part is ≤ 20 MB. */
export async function getFileBytes(
  token: string,
  fileId: string,
): Promise<Buffer> {
  const meta = await fetchJson<TgResult<{ file_path: string }>>(
    'Telegram getFile',
    `${base()}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
  );
  const res = await fetch(
    `${base()}/file/bot${token}/${meta.result.file_path}`,
  );
  if (!res.ok)
    throw new ProviderError(`Telegram file download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}
