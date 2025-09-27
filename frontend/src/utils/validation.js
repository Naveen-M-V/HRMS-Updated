/**
 * Validation utilities for form inputs
 */

// Text-only validation (letters, spaces, hyphens, apostrophes)
export const validateTextOnly = (value) => {
  const textOnlyRegex = /^[a-zA-Z\s\-']*$/;
  return textOnlyRegex.test(value);
};

// Email validation
export const validateEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

// Phone number validation (basic)
export const validatePhone = (value) => {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(value);
};

// Name validation (allows letters, spaces, hyphens, apostrophes)
export const validateName = (value) => {
  const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
  return nameRegex.test(value);
};

// Job title validation (allows alphanumeric, spaces, common symbols)
export const validateJobTitle = (value) => {
  const jobTitleRegex = /^[a-zA-Z0-9\s\-&\.,()]{2,100}$/;
  return jobTitleRegex.test(value);
};

// Certificate name validation (allows alphanumeric, spaces, common symbols)
export const validateCertificateName = (value) => {
  const certificateRegex = /^[a-zA-Z0-9\s\-&\.,()]{2,100}$/;
  return certificateRegex.test(value);
};

// Generic validation function
export const validateField = (value, type = 'text') => {
  switch (type) {
    case 'name':
      return validateName(value);
    case 'email':
      return validateEmail(value);
    case 'phone':
      return validatePhone(value);
    case 'jobTitle':
      return validateJobTitle(value);
    case 'certificate':
      return validateCertificateName(value);
    case 'text':
    default:
      return validateTextOnly(value);
  }
};

// Get validation error message
export const getValidationError = (fieldName, type = 'text') => {
  switch (type) {
    case 'name':
      return `${fieldName} should only contain letters, spaces, hyphens, and apostrophes`;
    case 'email':
      return 'Please enter a valid email address';
    case 'phone':
      return 'Please enter a valid phone number';
    case 'jobTitle':
      return 'Job title contains invalid characters';
    case 'certificate':
      return 'Certificate name contains invalid characters';
    default:
      return `${fieldName} contains invalid characters`;
  }
};
