import { ElevationPoint } from '../elevation'

// Berlin Marathon elevation profile - World's fastest marathon course
// Extremely flat with minimal elevation change, perfect for personal records
export const BERLIN_MARATHON_ELEVATION: ElevationPoint[] = [
  { distance: 0, elevation: 115 }, // Brandenburg Gate start area
  { distance: 1, elevation: 113 },
  { distance: 2, elevation: 111 },
  { distance: 3, elevation: 109 }, // Tiergarten
  { distance: 4, elevation: 107 },
  { distance: 5, elevation: 105 },
  { distance: 6, elevation: 103 }, // Charlottenburg
  { distance: 7, elevation: 101 },
  { distance: 8, elevation: 99 },
  { distance: 9, elevation: 97 },
  { distance: 10, elevation: 95 }, // Spandau approach
  { distance: 11, elevation: 93 },
  { distance: 12, elevation: 91 },
  { distance: 13, elevation: 89 }, // Halfway point
  { distance: 14, elevation: 87 },
  { distance: 15, elevation: 85 },
  { distance: 16, elevation: 83 },
  { distance: 17, elevation: 81 }, // Kreuzberg area
  { distance: 18, elevation: 79 },
  { distance: 19, elevation: 77 },
  { distance: 20, elevation: 75 },
  { distance: 21, elevation: 77 }, // Slight rise through Mitte
  { distance: 22, elevation: 79 },
  { distance: 23, elevation: 81 },
  { distance: 24, elevation: 83 },
  { distance: 25, elevation: 85 },
  { distance: 26, elevation: 87 }, // Final approach to Brandenburg Gate
  { distance: 26.2, elevation: 89 }, // Brandenburg Gate finish
]
