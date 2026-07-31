import { normalizeArPhone } from '@/utils/phone';

describe('normalizeArPhone', () => {
  it('returns null for empty input', () => {
    expect(normalizeArPhone('')).toBeNull();
    expect(normalizeArPhone('   ')).toBeNull();
  });

  it('normalizes a plain 10-digit national number', () => {
    expect(normalizeArPhone('1122381010')).toBe('+5491122381010');
  });

  it('strips a mobile "9" marker already present', () => {
    expect(normalizeArPhone('91122381010')).toBe('+5491122381010');
  });

  it('strips a country code without the mobile marker', () => {
    expect(normalizeArPhone('541122381010')).toBe('+5491122381010');
  });

  it('strips a full "+54 9" prefix already present', () => {
    expect(normalizeArPhone('+5491122381010')).toBe('+5491122381010');
    expect(normalizeArPhone('+54 9 11 2238-1010')).toBe('+5491122381010');
  });

  it('strips the local trunk "0" prefix', () => {
    expect(normalizeArPhone('01122381010')).toBe('+5491122381010');
  });

  it('strips an old-style inserted "15" after the trunk 0', () => {
    // "011 15 22381010" — Buenos Aires (2-digit area code) dialed the old
    // local-mobile way: trunk 0 + area code + inserted 15 + subscriber.
    expect(normalizeArPhone('0111522381010')).toBe('+5491122381010');
  });

  it('rejects numbers that are too short or too long once cleaned', () => {
    expect(normalizeArPhone('123')).toBeNull();
    expect(normalizeArPhone('112238101099')).toBeNull();
  });
});
