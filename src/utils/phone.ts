// Argentine phone numbers, normalized to E.164 (+549XXXXXXXXXX) — the
// format WhatsApp's wa.me links require. Without the "9" mobile marker,
// wa.me misreads the number (e.g. a leading "1" after +54 gets read as a
// US country code), silently opening the wrong chat or none at all.
//
// A national Argentine number (area code + subscriber number, no trunk
// "0", no inserted "15") is always exactly 10 digits, regardless of
// whether the area code is 2, 3, or 4 digits long — so "10 digits left
// after cleanup" is what we validate against, rather than a full area
// code table.

const NATIONAL_NUMBER_LENGTH = 10;

export function normalizeArPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  // Strip a country code the user already included (with or without the
  // mobile "9"): "+5491122381864", "+541122381864", "541122381864".
  if (digits.startsWith('54') && digits.length >= NATIONAL_NUMBER_LENGTH + 2) {
    digits = digits.slice(2);
  }

  // Strip a mobile marker "9" the user already included.
  if (digits.startsWith('9') && digits.length === NATIONAL_NUMBER_LENGTH + 1) {
    digits = digits.slice(1);
  }

  // Strip the trunk prefix "0" used for local dialing ("0221...").
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Strip an inserted "15" (old local-mobile dialing: "11 15 2345 6789").
  // Only the 2/3/4-digit area code positions are plausible; removing "15"
  // from any of them should leave exactly a national number's worth of digits.
  if (digits.length === NATIONAL_NUMBER_LENGTH + 2) {
    for (const areaLen of [2, 3, 4]) {
      if (digits.slice(areaLen, areaLen + 2) === '15') {
        digits = digits.slice(0, areaLen) + digits.slice(areaLen + 2);
        break;
      }
    }
  }

  if (digits.length !== NATIONAL_NUMBER_LENGTH) return null;

  return `+549${digits}`;
}
