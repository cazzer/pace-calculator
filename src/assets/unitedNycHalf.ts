import { ElevationPoint } from '../elevation'

// United NYC Half Marathon elevation profile - Brooklyn to Manhattan route
// Notable climbs including Brooklyn Bridge and FDR Drive underpasses
export const UNITED_NYC_HALF_ELEVATION: ElevationPoint[] = [
  { distance: 0, elevation: 85 }, // Prospect Park start
  { distance: 1, elevation: 80 }, // Prospect Park loop
  { distance: 2, elevation: 75 }, // Exit Prospect Park
  { distance: 3, elevation: 65 }, // Flatbush Avenue descent
  { distance: 4, elevation: 55 }, // Atlantic Avenue
  { distance: 5, elevation: 45 }, // Brooklyn Heights approach
  { distance: 6, elevation: 35 }, // Brooklyn Heights Promenade area
  { distance: 7, elevation: 125 }, // Brooklyn Bridge climb
  { distance: 7.5, elevation: 135 }, // Peak of Brooklyn Bridge
  { distance: 8, elevation: 130 }, // Brooklyn Bridge descent
  { distance: 8.5, elevation: 45 }, // FDR Drive level
  { distance: 9, elevation: 35 }, // South Street Seaport
  { distance: 10, elevation: 30 }, // Financial District
  { distance: 11, elevation: 25 }, // Battery Park area
  { distance: 12, elevation: 20 }, // West Side Highway
  { distance: 13, elevation: 15 }, // Finish in Central Park area
  { distance: 13.1, elevation: 112 }, // Central Park finish (same as full marathon)
]
