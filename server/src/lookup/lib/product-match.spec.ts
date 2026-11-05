import type { AttributeDef } from '../../device-models/lib/attribute-schema.js';
import {
  linkKey,
  matchAttributeOption,
  modelMatchKey,
} from './product-match.js';

describe('modelMatchKey', () => {
  it('ignores case and spacing', () => {
    expect(modelMatchKey('Apple', 'iPhone 11')).toBe(
      modelMatchKey('APPLE', ' iphone  11 '),
    );
  });

  it('ignores a leading brand word in the model', () => {
    expect(modelMatchKey('Apple', 'iPhone 11')).toBe(
      modelMatchKey('Apple', 'Apple iPhone 11'),
    );
    expect(modelMatchKey('Samsung', 'Galaxy S23')).toBe(
      modelMatchKey('Samsung', 'Samsung Galaxy S23'),
    );
  });

  it('keeps different models apart', () => {
    expect(modelMatchKey('Apple', 'iPhone 11')).not.toBe(
      modelMatchKey('Apple', 'iPhone 12'),
    );
  });
});

describe('linkKey', () => {
  it('is case- and space-insensitive', () => {
    expect(linkKey('Apple', 'iPhone 15 Pro Max')).toBe(
      linkKey('apple', 'iphone15promax'),
    );
  });
});

describe('matchAttributeOption', () => {
  const attrs: AttributeDef[] = [
    {
      key: 'storage',
      label: 'Storage',
      type: 'select',
      options: ['128GB', '256GB', '512GB'],
      required: true,
      sortOrder: 10,
    },
    {
      key: 'color',
      label: 'Color',
      type: 'select',
      options: ['Natural Titanium', 'Blue'],
      required: false,
      sortOrder: 20,
    },
  ];

  it('matches ignoring case and spaces (256gb → 256GB)', () => {
    expect(matchAttributeOption(attrs, 'storage', '256gb')).toBe('256GB');
    expect(matchAttributeOption(attrs, 'color', 'natural titanium')).toBe(
      'Natural Titanium',
    );
  });

  it('is null when no option matches, the value is empty, or there is no such attribute', () => {
    expect(matchAttributeOption(attrs, 'storage', '1TB')).toBeNull();
    expect(matchAttributeOption(attrs, 'storage', null)).toBeNull();
    expect(matchAttributeOption(attrs, 'ram', '8GB')).toBeNull();
  });
});
