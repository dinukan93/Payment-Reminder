// Fixed region and RTOM values
export const REGIONS_AND_RTOMS = {
  'Western': ['Colombo', 'Negombo', 'Gampaha'],
  'Central': ['Kandy', 'Matale'],
  'Southern': ['Galle', 'Matara'],
  'Northern': ['Jaffna'],
  'Eastern': ['Batticaloa'],
  'North Central': [],
  'Sabaragamuwa': [],
  'Uva': []
};

export const ALL_REGIONS = Object.keys(REGIONS_AND_RTOMS).sort();

export const ALL_RTOMS = [
  'Colombo',
  'Negombo',
  'Gampaha',
  'Kandy',
  'Matale',
  'Galle',
  'Matara',
  'Jaffna',
  'Batticaloa'
].sort();

// Get RTOMs for a specific region
export const getRtomsForRegion = (region) => {
  return REGIONS_AND_RTOMS[region] || [];
};
