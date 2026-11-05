import { PayloadTooLargeException, BadRequestException } from '@nestjs/common';
import {
  MAX_IMAGE_BYTES,
  assertValidImage,
  detectImageType,
} from './image-file.js';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 1]);
const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3]);
const webp = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('WEBP', 'ascii'),
  Buffer.from([0, 1]),
]);
const text = Buffer.from('this is plainly a text file, not an image', 'utf8');

describe('detectImageType (magic bytes, not name/mime)', () => {
  it('detects PNG, JPEG and WebP by their leading bytes', () => {
    expect(detectImageType(png)).toBe('png');
    expect(detectImageType(jpg)).toBe('jpg');
    expect(detectImageType(webp)).toBe('webp');
  });

  it('accepts a PNG regardless of what the file is named .jpg', () => {
    // The bytes are PNG; a .jpg name is irrelevant — we never read the name.
    expect(detectImageType(png)).toBe('png');
  });

  it('rejects a text file renamed .png', () => {
    expect(detectImageType(text)).toBeNull();
  });
});

describe('assertValidImage', () => {
  it('returns the real extension for a valid image', () => {
    expect(assertValidImage(png)).toBe('png');
  });

  it('rejects a text file renamed .png', () => {
    expect(() => assertValidImage(text)).toThrow(BadRequestException);
  });

  it('rejects an empty/missing upload', () => {
    expect(() => assertValidImage(undefined)).toThrow(BadRequestException);
    expect(() => assertValidImage(Buffer.alloc(0))).toThrow(
      BadRequestException,
    );
  });

  it('rejects a file over 2 MB', () => {
    const oversized = Buffer.concat([png, Buffer.alloc(MAX_IMAGE_BYTES)]);
    expect(() => assertValidImage(oversized)).toThrow(PayloadTooLargeException);
  });
});
