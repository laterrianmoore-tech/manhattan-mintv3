export const PRICING = {
  standard: {
    'studio_1br': 175,
    '2br': 225,
    '3br': 275,
    '4plus': null, // null = custom quote
  },
  addOns: {
    deepClean: 75,
    moveInOut: 100,
  },
  recurringDiscount: {
    weekly: 0.20,
    biWeekly: 0.15,
    monthly: 0.10,
  },
  hourlyRate: 65, // per cleaner per hour
};

export const SERVICE_AREA = {
  covered: 'all of Manhattan, plus select Brooklyn and Queens neighborhoods on request',
  notCovered: ['the Bronx', 'Staten Island'],
  manhattanNeighborhoods: [
    'Tribeca', 'SoHo', 'West Village', 'Greenwich Village', 'Chelsea',
    'Flatiron', 'Gramercy', 'Murray Hill', 'Midtown', "Hell's Kitchen",
    'Upper East Side', 'Upper West Side', 'Harlem', 'Washington Heights',
    'FiDi', 'Battery',
  ],
};

export const BOOKING_RULES = {
  minLeadTimeHours: 48,
  confirmationDelayHours: 'a few',
};

export const SERVICES_NOT_OFFERED = [
  'post-construction cleans',
  'carpet shampooing',
  'pest treatment',
  'exterior windows above the 2nd floor',
  'biohazard cleanup',
  'hoarding situations',
];
