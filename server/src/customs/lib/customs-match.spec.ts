import {
  baseCustomsKey,
  matchCustomsFee,
  normalizeCustomsKey,
} from './customs-match.js';

describe('normalizeCustomsKey', () => {
  it('upper-cases and collapses whitespace', () => {
    expect(normalizeCustomsKey('  iPhone   15   Pro  ')).toBe('IPHONE 15 PRO');
  });

  it('removes whitespace before GB and TB', () => {
    expect(normalizeCustomsKey('iPhone 15 Pro 256 GB')).toBe(
      'IPHONE 15 PRO 256GB',
    );
    expect(normalizeCustomsKey('iPad Pro 1 TB')).toBe('IPAD PRO 1TB');
    expect(normalizeCustomsKey('256   GB')).toBe('256GB');
  });

  it('leaves codes without storage intact', () => {
    expect(normalizeCustomsKey('S24 Ultra')).toBe('S24 ULTRA');
    expect(normalizeCustomsKey('Note 20 Ultra')).toBe('NOTE 20 ULTRA');
  });
});

describe('matchCustomsFee', () => {
  const feeMap = new Map<string, number>([
    [normalizeCustomsKey('iPhone 15 Pro 128 GB'), 94],
    [normalizeCustomsKey('iPhone 15 Pro 256 GB'), 94],
    [normalizeCustomsKey('S24 Ultra'), 93],
    [normalizeCustomsKey('Note 20 Ultra'), 65],
  ]);

  it('matches customsCode + storage first (iPhone 15 Pro + 256GB -> 94)', () => {
    expect(matchCustomsFee(feeMap, 'iPhone 15 Pro', '256GB')).toBe(94);
    expect(matchCustomsFee(feeMap, 'iPhone 15 Pro', '128 GB')).toBe(94);
  });

  it('falls back to customsCode alone when storage-specific fee is not in the list (S24 Ultra + 256GB -> 93)', () => {
    expect(matchCustomsFee(feeMap, 'S24 Ultra', '256GB')).toBe(93);
    expect(matchCustomsFee(feeMap, 'Note 20 Ultra', '512GB')).toBe(65);
    expect(matchCustomsFee(feeMap, 'Note 20 Ultra')).toBe(65);
  });

  it('returns 0 when customsCode is missing, empty or unmatched', () => {
    expect(matchCustomsFee(feeMap, null, '256GB')).toBe(0);
    expect(matchCustomsFee(feeMap, '', '256GB')).toBe(0);
    expect(matchCustomsFee(feeMap, 'NonExistentModel', '256GB')).toBe(0);
  });
});

describe('baseCustomsKey', () => {
  it('drops a trailing storage token', () => {
    expect(baseCustomsKey('iPhone 15 Pro 256 GB')).toBe('IPHONE 15 PRO');
    expect(baseCustomsKey('S24 Ultra')).toBe('S24 ULTRA');
    expect(baseCustomsKey('Tab 1 TB')).toBe('TAB');
  });
});
