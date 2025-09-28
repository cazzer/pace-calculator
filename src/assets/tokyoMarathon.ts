import { ElevationPoint } from '../elevation'

// Tokyo Marathon elevation profile - Relatively flat urban course with some gentle undulations
// Net uphill course but very manageable, great for personal records
export const TOKYO_MARATHON_ELEVATION: ElevationPoint[] = [
  { distance: 0, elevation: 16 }, // Tokyo Metropolitan Government Building start
  { distance: 1, elevation: 18 },
  { distance: 2, elevation: 20 }, // Shinjuku area
  { distance: 3, elevation: 22 },
  { distance: 4, elevation: 25 }, // Yotsuya
  { distance: 5, elevation: 28 },
  { distance: 6, elevation: 30 }, // Imperial Palace area
  { distance: 7, elevation: 32 },
  { distance: 8, elevation: 35 }, // Ginza
  { distance: 9, elevation: 38 },
  { distance: 10, elevation: 40 }, // Tokyo Station area
  { distance: 11, elevation: 42 },
  { distance: 12, elevation: 45 }, // Sumida River approach
  { distance: 13, elevation: 48 }, // Halfway point
  { distance: 14, elevation: 50 },
  { distance: 15, elevation: 52 }, // Asakusa
  { distance: 16, elevation: 55 },
  { distance: 17, elevation: 58 }, // Koto ward
  { distance: 18, elevation: 60 },
  { distance: 19, elevation: 62 },
  { distance: 20, elevation: 65 }, // Tokyo Big Sight area
  { distance: 21, elevation: 68 },
  { distance: 22, elevation: 70 },
  { distance: 23, elevation: 68 }, // Slight descent back toward center
  { distance: 24, elevation: 65 },
  { distance: 25, elevation: 62 },
  { distance: 26, elevation: 60 }, // Final approach
  { distance: 26.2, elevation: 58 }, // Imperial Palace finish
]
