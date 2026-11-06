import { BadRequestException } from '@nestjs/common';

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

export type AllowedLogoMime = 'image/png' | 'image/jpeg' | 'image/webp';

/**
 * Validates logo file using magic bytes (file signature), not file extension or mime header.
 * Disallows SVG (which can contain executable XML/scripts) and non-image payloads.
 */
export function detectLogoMime(buffer: Buffer): AllowedLogoMime {
  if (buffer.length > MAX_LOGO_BYTES) {
    throw new BadRequestException('Logo file exceeds maximum size of 2 MB');
  }

  if (buffer.length < 12) {
    throw new BadRequestException('Invalid logo file');
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // JPEG signature: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // WebP signature: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  throw new BadRequestException(
    'Only PNG, JPG, or WebP images are allowed for shop logo. SVG is not permitted.',
  );
}
