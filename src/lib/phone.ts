/**
 * Normalizes a phone number for WhatsApp click-to-chat links.
 * WhatsApp's wa.me API expects digits only, including country code, no leading +.
 */
export function normalizePhone(raw: string, defaultCountryCode = ""): string {
  let digits = raw.replace(/[^\d+]/g, "");
  digits = digits.replace(/(?!^)\+/g, "");

  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (defaultCountryCode && !digits.startsWith(defaultCountryCode)) {
    // Strip a single leading 0 (common trunk prefix) before prepending country code.
    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }
    digits = `${defaultCountryCode}${digits}`;
  }

  return digits;
}

export function isValidPhoneDigits(digits: string): boolean {
  return /^\d{7,15}$/.test(digits);
}

export function formatPhoneDisplay(digits: string): string {
  if (!digits) return "";
  return `+${digits}`;
}
