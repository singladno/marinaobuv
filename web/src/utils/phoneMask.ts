/**
 * Phone mask utility for Russian phone numbers (+7 format)
 */

export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // If empty, return empty
  if (!digits) return '';

  // If starts with 8, replace with 7
  let cleanDigits = digits;
  if (cleanDigits.startsWith('8')) {
    cleanDigits = '7' + cleanDigits.slice(1);
  }

  // If doesn't start with 7, add 7
  if (!cleanDigits.startsWith('7')) {
    cleanDigits = '7' + cleanDigits;
  }

  // Limit to 11 digits (7 + 10 digits)
  cleanDigits = cleanDigits.slice(0, 11);

  // Format based on length
  if (cleanDigits.length <= 1) {
    return '+7';
  } else if (cleanDigits.length <= 4) {
    return `+7 (${cleanDigits.slice(1)}`;
  } else if (cleanDigits.length <= 7) {
    return `+7 (${cleanDigits.slice(1, 4)}) ${cleanDigits.slice(4)}`;
  } else if (cleanDigits.length <= 9) {
    return `+7 (${cleanDigits.slice(1, 4)}) ${cleanDigits.slice(4, 7)}-${cleanDigits.slice(7)}`;
  } else {
    return `+7 (${cleanDigits.slice(1, 4)}) ${cleanDigits.slice(4, 7)}-${cleanDigits.slice(7, 9)}-${cleanDigits.slice(9)}`;
  }
}

export function getCleanPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // If empty, return empty
  if (!digits) return '';

  // If starts with 8, replace with 7
  let cleanDigits = digits;
  if (cleanDigits.startsWith('8')) {
    cleanDigits = '7' + cleanDigits.slice(1);
  }

  // If doesn't start with 7, add 7
  if (!cleanDigits.startsWith('7')) {
    cleanDigits = '7' + cleanDigits;
  }

  // Limit to 11 digits (7 + 10 digits)
  return cleanDigits.slice(0, 11);
}

export function isValidPhoneNumber(value: string): boolean {
  const cleanPhone = getCleanPhoneNumber(value);
  return cleanPhone.length === 11 && cleanPhone.startsWith('7');
}
