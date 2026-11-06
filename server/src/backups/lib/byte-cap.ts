import { PayloadTooLargeException } from '@nestjs/common';
import { Transform } from 'node:stream';

/** The largest restore source accepted (upload or a remote download). */
export function maxUploadBytes(): number {
  return Number(process.env.BACKUP_MAX_UPLOAD_BYTES) || 2 * 1024 * 1024 * 1024;
}

/** A Transform that errors once more than `max` bytes have passed through, so a
 * stream piped to disk is bounded (a remote cannot fill the disk). */
export function byteCap(max: number): Transform {
  let seen = 0;
  return new Transform({
    transform(chunk: Buffer, _enc, cb) {
      seen += chunk.length;
      if (seen > max) {
        cb(
          new PayloadTooLargeException(
            'Backup is larger than the allowed size',
          ),
        );
      } else {
        cb(null, chunk);
      }
    },
  });
}
