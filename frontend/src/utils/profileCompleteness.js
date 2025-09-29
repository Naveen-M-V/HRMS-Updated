// utils/profileCompleteness.js

export function getProfileCompleteness(profile = {}) {
  const fields = [
    ['firstName'], ['lastName'], ['email'], ['mobile'],
    ['dateOfBirth'], ['gender'], ['nationality'], ['location'], ['bio'],
    ['jobTitle'], ['department'], ['company'], ['staffType'],
    ['address','line1'], ['address','city'], ['address','postCode'], ['address','country'],
    ['emergencyContact','name'], ['emergencyContact','relationship'], ['emergencyContact','phone'],
    ['profilePicture']
  ];

  const isFilled = (value) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.filter(Boolean).length > 0;
    if (value instanceof Date) return !isNaN(value.getTime());
    const s = String(value).trim();
    return s.length > 0 && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined';
  };

  const missing = [];
  let filled = 0;

  for (const path of fields) {
    let v = profile;
    for (const key of path) v = v?.[key];

    if (path.length === 1 && path[0] === 'jobTitle') {
      const jt = Array.isArray(profile.jobTitle) ? profile.jobTitle.filter(Boolean).join(', ') : profile.jobTitle;
      if (isFilled(jt)) filled++; else missing.push('jobTitle');
      continue;
    }
    if (path.length === 1 && path[0] === 'dateOfBirth' && typeof v === 'string') {
      const d = new Date(v);
      if (isFilled(d)) filled++; else missing.push('dateOfBirth');
      continue;
    }

    if (isFilled(v)) filled++; else missing.push(path.join('.'));
  }

  const percent = Math.round((filled / fields.length) * 100);
  return { percent, missing, total: fields.length, filled };
}
