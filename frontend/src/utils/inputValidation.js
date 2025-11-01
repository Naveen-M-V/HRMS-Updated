/**
 * Input Validation Utilities
 * Provides validation functions for text-only and number-only inputs
 */

/**
 * Validates and filters text-only input (letters, spaces, hyphens, apostrophes)
 * @param {string} value - Input value to validate
 * @returns {string} - Filtered value containing only valid text characters
 */
export const validateTextOnly = (value) => {
  // Allow letters (any language), spaces, hyphens, and apostrophes
  return value.replace(/[^a-zA-Z\s\-']/g, '');
};

/**
 * Validates and filters number-only input (digits only)
 * @param {string} value - Input value to validate
 * @returns {string} - Filtered value containing only digits
 */
export const validateNumberOnly = (value) => {
  // Allow only digits 0-9
  return value.replace(/[^0-9]/g, '');
};

/**
 * Validates and filters phone number input (digits, spaces, hyphens, plus, parentheses)
 * @param {string} value - Input value to validate
 * @returns {string} - Filtered value containing only valid phone characters
 */
export const validatePhoneNumber = (value) => {
  // Allow digits, spaces, hyphens, plus sign, and parentheses
  return value.replace(/[^0-9\s\-+()]/g, '');
};

/**
 * Validates and filters email input (basic email characters)
 * @param {string} value - Input value to validate
 * @returns {string} - Filtered value containing only valid email characters
 */
export const validateEmail = (value) => {
  // Allow alphanumeric, @, dot, hyphen, underscore
  return value.replace(/[^a-zA-Z0-9@.\-_]/g, '').toLowerCase();
};

/**
 * Validates and filters alphanumeric input (letters and numbers only)
 * @param {string} value - Input value to validate
 * @returns {string} - Filtered value containing only alphanumeric characters
 */
export const validateAlphanumeric = (value) => {
  // Allow letters and numbers only
  return value.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Validates and filters decimal number input (digits and single decimal point)
 * @param {string} value - Input value to validate
 * @returns {string} - Filtered value containing only valid decimal number
 */
export const validateDecimal = (value) => {
  // Allow digits and single decimal point
  const parts = value.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return value.replace(/[^0-9.]/g, '');
};

/**
 * Handler for text-only input fields
 * Use with onChange event
 */
export const handleTextOnlyChange = (e, setter) => {
  const validValue = validateTextOnly(e.target.value);
  setter(validValue);
};

/**
 * Handler for number-only input fields
 * Use with onChange event
 */
export const handleNumberOnlyChange = (e, setter) => {
  const validValue = validateNumberOnly(e.target.value);
  setter(validValue);
};

/**
 * Prevents non-numeric key presses
 * Use with onKeyPress event
 */
export const preventNonNumeric = (e) => {
  if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
    e.preventDefault();
  }
};

/**
 * Prevents non-text key presses
 * Use with onKeyPress event
 */
export const preventNonText = (e) => {
  if (!/[a-zA-Z\s\-']/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
    e.preventDefault();
  }
};
