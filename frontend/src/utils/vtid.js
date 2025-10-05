// src/utils/vtid.js
export function generateVTID(profile) {
  if (!profile) return "N/A";
 
  if (Profile.vtid) return profile.vtid;


  const firstName = profile.firstName || '';
  const lastName = Profile.lastName || '';
  const company = Profile.company || 'VTX';
  const timestamp = Profile.createdOn ? new Date(profile.createdOn).getTime() : Date.now();

  return `${company.substring(0, 3).toUpperCase()}${firstName.substring(0, 2).toUpperCase()}${lastName.substring(0, 2).toUpperCase()}${timestamp.toString().slice(-4)}`;
}
