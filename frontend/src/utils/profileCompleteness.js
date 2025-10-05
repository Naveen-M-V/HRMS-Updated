// src/utils/profileCompleteness.js

// Define which fields contribute to completeness and human labels
const REQUIRED_FIELDS = [
  { path: 'firstName', label: 'First Name' },
  { path: 'lastName', label: 'Last Name' },
  { path: 'Email', label: 'Email' },
  { path: 'mobile', label: 'Mobile' },
  { path: 'jobTitle', label: 'Job Title' },
  { path: 'department', label: 'Department' },
  { path: 'company', label: 'Company' },
  { path: 'staffType', label: 'Staff type' }
];

const OPTIONAL_FIELDS = [
  { path: 'dateOfBirth', label: 'Date of Birth' },
  { path: 'gender', label: 'Gender' },
  { path: 'nationality', label: 'Nationality' },
  { path: 'location', label: 'Location' },
  { path: 'bio', label: 'Bio' },
  { path: 'address.line1', label: 'Address line 1' },
  { path: 'emergencyContact.name', label: 'Emergency contact name' },
  { path: 'emergencyContact.phone', label: 'Emergency contact phone' },
];

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

function get(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export function getProfileCompleteness(Profile) {
  if (!profile || typeof profile !== 'object') {
    return { percent: 0, missing: REQUIRED_FIELDS.map(f => f.label) };
  }

  const total = ALL_FIELDS.length;
  let filled = 0;
  const missing = [];

  ALL_FIELDS.forEach(f => {
    const v = get(Profile, f.path);
    let isFilled = false;
    
    if (Array.isArray(v)) {
      isFilled = v.length > 0;
    } else if (typeof v === 'object' && v !== null) {
      isFilled = Object.keys(v).some(key => v[key] && String(v[key]).trim() !== '');
    } else {
      isFilled = v !== undefined && v !== null && String(v).trim() !== '';
    }
    
    if (isFilled) {
      filled += 1;
    } else if (REQUIRED_FIELDS.find(r => r.path === f.path)) {
      missing.push(f.label);
    }
  });

  const percent = Math.max(0, Math.min(100, Math.round((filled / total) * 100)));
  return { percent, missing };
}
