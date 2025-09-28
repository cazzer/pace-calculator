import { ElevationPoint } from '../elevation'

// NYC Marathon elevation profile - Iconic course with the Verrazzano-Narrows Bridge and Central Park
// Notable hills at the start and in the second half (e.g., 4th Ave, 92nd St. Hill)
export const NYC_MARATHON_ELEVATION: ElevationPoint[] = [
  { distance: 0, elevation: 16 }, // Fort Wadsworth start
  { distance: 0.5, elevation: 18 },
  { distance: 1, elevation: 185 }, // Verrazzano Bridge climb
  { distance: 1.5, elevation: 228 }, // Peak of Verrazzano Bridge
  { distance: 2, elevation: 210 },
  { distance: 2.5, elevation: 82 }, // Descent into Brooklyn
  { distance: 3, elevation: 62 },
  { distance: 4, elevation: 52 },
  { distance: 5, elevation: 49 },
  { distance: 6, elevation: 46 },
  { distance: 7, elevation: 43 },
  { distance: 8, elevation: 41 },
  { distance: 9, elevation: 39 },
  { distance: 10, elevation: 38 },
  { distance: 11, elevation: 36 },
  { distance: 12, elevation: 35 },
  { distance: 13, elevation: 33 }, // Halfway point in Brooklyn
  { distance: 14, elevation: 32 },
  { distance: 15, elevation: 31 },
  { distance: 15.5, elevation: 35 }, // Slight rise approaching Queensboro
  { distance: 16, elevation: 125 }, // Queensboro Bridge climb
  { distance: 16.5, elevation: 135 }, // Peak of Queensboro Bridge
  { distance: 17, elevation: 130 },
  { distance: 17.5, elevation: 65 }, // Descent into Manhattan
  { distance: 18, elevation: 52 },
  { distance: 19, elevation: 49 },
  { distance: 20, elevation: 98 }, // Willis Ave Bridge to Bronx
  { distance: 20.5, elevation: 105 },
  { distance: 21, elevation: 102 },
  { distance: 21.5, elevation: 95 }, // Back to Manhattan via Madison Ave Bridge
  { distance: 22, elevation: 89 },
  { distance: 23, elevation: 85 },
  { distance: 24, elevation: 88 },
  { distance: 25, elevation: 92 },
  { distance: 26, elevation: 108 }, // Central Park rise
  { distance: 26.2, elevation: 112 }, // Central Park finish
]
