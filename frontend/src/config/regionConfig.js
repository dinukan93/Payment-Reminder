// Fixed region and RTOM values based on SLT structure
export const REGIONS_AND_RTOMS = {
  'Metro Region': [
    { code: 'CO', name: 'Colombo Central (General)' },
    { code: 'MA', name: 'Maradana' },
    { code: 'ND', name: 'Nugegoda' },
    { code: 'HK', name: 'Havelock Town' },
    { code: 'KX', name: 'Kotte' },
    { code: 'WT', name: 'Wattala' },
    { code: 'RM', name: 'Ratmalana' },
    { code: 'MD', name: 'Moratuwa/Mt. Lavinia' },
    { code: 'ML', name: 'Mount Lavinia' }
  ],
  'Region 1': [
    { code: 'AN', name: 'Anuradhapura' },
    { code: 'CW', name: 'Chilaw' },
    { code: 'GP', name: 'Gampola' },
    { code: 'KA', name: 'Kandy' },
    { code: 'KU', name: 'Kurunegala' },
    { code: 'MT', name: 'Matale' },
    { code: 'NE', name: 'Negombo' },
    { code: 'PO', name: 'Polonnaruwa' },
    { code: 'KI', name: 'Identifier currently unknown' }
  ],
  'Region 2': [
    { code: 'AV', name: 'Avissawella' },
    { code: 'BA', name: 'Badulla' },
    { code: 'BW', name: 'Bandarawela' },
    { code: 'GA', name: 'Galle' },
    { code: 'HB', name: 'Hambantota' },
    { code: 'HA', name: 'Hatton' },
    { code: 'KL', name: 'Kalutara' },
    { code: 'KG', name: 'Kegalle' },
    { code: 'MA', name: 'Matara' },
    { code: 'NE', name: 'Nuwara Eliya' },
    { code: 'RA', name: 'Ratnapura' }
  ],
  'Region 3': [
    { code: 'AM', name: 'Ampara' },
    { code: 'BT', name: 'Batticaloa' },
    { code: 'JA', name: 'Jaffna' },
    { code: 'KM', name: 'Kalmunai' },
    { code: 'KO', name: 'Mannar' },
    { code: 'TR', name: 'Trincomalee' },
    { code: 'VU', name: 'Vavuniya' }
  ]
};

export const ALL_REGIONS = Object.keys(REGIONS_AND_RTOMS);

// Get all RTOMs as a flat array
export const ALL_RTOMS = Object.values(REGIONS_AND_RTOMS)
  .flat()
  .map(rtom => ({ code: rtom.code, name: rtom.name, display: `${rtom.code} - ${rtom.name}` }));

// Get RTOMs for a specific region
export const getRtomsForRegion = (region) => {
  return REGIONS_AND_RTOMS[region] || [];
};

// Get region for a specific RTOM code
export const getRegionForRtom = (rtomCode) => {
  if (!rtomCode) return null;
  const upperCode = rtomCode.toString().trim().toUpperCase();

  for (const [region, rtoms] of Object.entries(REGIONS_AND_RTOMS)) {
    if (rtoms.find(r => r.code.toUpperCase() === upperCode)) {
      return region;
    }
  }
  return null;
};

// Role hierarchy for permissions
export const ROLE_HIERARCHY = {
  superadmin: 5,
  region_admin: 4,
  rtom_admin: 3,
  supervisor: 2,
  caller: 1
};

// Check if user has permission based on role hierarchy
export const hasPermission = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};
