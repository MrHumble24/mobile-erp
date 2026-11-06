import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { promises as fsp } from 'node:fs';
import { Readable } from 'node:stream';
import type {
  BackupFile,
  BackupStorage,
  Destination,
  RemoteRef,
  StorageCapabilities,
} from './backup-storage.js';
import { ProviderError } from './lib/provider-http.js';
import { getFileBytes, sendDocument, sendMessage } from './lib/telegram-api.js';

/** 19 MB parts: a bot sends files up to 50 MB and fetches back up to 20 MB. */
const PART_BYTES = 19 * 1024 * 1024;

interface TgConfig {
  chatId?: string;
}
interface TgSecret {
  botToken?: string;
}
interface TgRef {
  parts: string[];
  name: string;
  sha256: string;
}

function creds(dest: Destination): { token: string; chatId: string } {
  const token = (dest.secret as TgSecret)?.botToken;
  const chatId = (dest.config as TgConfig)?.chatId;
  if (!token) throw new ProviderError('Telegram bot token is not set');
  if (!chatId) throw new ProviderError('Telegram backup chat id is not set');
  return { token, chatId };
}

/**
 * Sends the encrypted backup to a Telegram chat in ≤19 MB parts (in order, each
 * captioned "part i of n"), and joins them back on download, verifying the whole
 * file's SHA-256. `delete` is false — old parts stay in the chat.
 */
@Injectable()
export class TelegramStorage implements BackupStorage {
  readonly code = 'TELEGRAM';
  readonly capabilities: StorageCapabilities = {
    list: false,
    download: true,
    delete: false,
    maxPartBytes: PART_BYTES,
  };

  async validate(config: unknown, secret: unknown): Promise<void> {
    const { token, chatId } = creds({ config, secret });
    await sendMessage(token, chatId, 'Malika Bazaar: backup place test — OK.');
  }

  async upload(file: BackupFile, dest: Destination): Promise<RemoteRef> {
    const { token, chatId } = creds(dest);
    const data = await fsp.readFile(file.path);
    const count = Math.max(1, Math.ceil(data.length / PART_BYTES));
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const slice = data.subarray(i * PART_BYTES, (i + 1) * PART_BYTES);
      const caption = `${file.name} — part ${i + 1} of ${count}`;
      parts.push(
        await sendDocument(
          token,
          chatId,
          Buffer.from(slice),
          `${file.name}.part${i + 1}`,
          caption,
        ),
      );
    }
    const ref: TgRef = { parts, name: file.name, sha256: sha256(data) };
    return { ref: JSON.stringify(ref) };
  }

  async download(ref: RemoteRef, dest: Destination): Promise<Readable> {
    const { token } = creds(dest);
    const parsed = JSON.parse(ref.ref) as TgRef;
    const chunks: Buffer[] = [];
    for (const fileId of parsed.parts)
      chunks.push(await getFileBytes(token, fileId));
    const joined = Buffer.concat(chunks);
    if (sha256(joined) !== parsed.sha256) {
      throw new ProviderError(
        'Telegram backup failed its checksum after joining the parts',
      );
    }
    return Readable.from(joined);
  }

  remove(): Promise<void> {
    // capabilities.delete === false: never called by retention or delete.
    return Promise.reject(
      new ProviderError('Telegram does not support deleting backups'),
    );
  }
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}
