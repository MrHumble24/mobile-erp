import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';

/** At most 2 MB per picture (ADR 0031). */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type ImageExt = 'jpg' | 'png' | 'webp';

/**
 * The real type of an image from its leading bytes — never its name or declared
 * MIME type, which a client controls. Returns null when the bytes are not one
 * of the three accepted formats.
 */
export function detectImageType(buffer: Buffer): ImageExt | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }
  // RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

/**
 * Validates an uploaded picture and returns its real extension. Throws a clean
 * 4xx when the file is missing, over 2 MB, or not a JPEG/PNG/WebP by its bytes.
 */
export function assertValidImage(buffer: Buffer | undefined): ImageExt {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException('No image file was uploaded (field "file")');
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new PayloadTooLargeException('Image must be at most 2 MB');
  }
  const ext = detectImageType(buffer);
  if (!ext) {
    throw new BadRequestException('Image must be a JPEG, PNG or WebP file');
  }
  return ext;
}
