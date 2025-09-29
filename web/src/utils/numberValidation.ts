interface NumberValidationResult {
  isValid: boolean;
  value: number | null;
  shouldRevert: boolean;
}

export function validateNumberInput(
  inputValue: string,
  min?: number,
  max?: number
): NumberValidationResult {
  const trimmedValue = inputValue.trim();

  if (trimmedValue === '') {
    return { isValid: true, value: null, shouldRevert: false };
  }

  const num = parseInt(trimmedValue, 10);

  if (isNaN(num) || num < 0) {
    return { isValid: false, value: null, shouldRevert: true };
  }

  // Check min/max constraints if provided
  if (min !== undefined && num < min) {
    return { isValid: false, value: null, shouldRevert: true };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, value: null, shouldRevert: true };
  }

  return { isValid: true, value: num, shouldRevert: false };
}
