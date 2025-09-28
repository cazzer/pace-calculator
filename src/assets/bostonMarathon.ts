import { ElevationPoint } from '../elevation'

// Boston Marathon elevation profile - Famous for Newton Hills and Heartbreak Hill
// Net downhill course (-460 feet) but with significant challenging climbs
export const BOSTON_MARATHON_ELEVATION: ElevationPoint[] = [
  { distance: 0, elevation: 490 }, // Hopkinton start - highest point
  { distance: 1, elevation: 450 }, // Early downhill
  { distance: 2, elevation: 400 },
  { distance: 3, elevation: 350 },
  { distance: 4, elevation: 320 },
  { distance: 5, elevation: 290 },
  { distance: 6, elevation: 260 }, // Framingham - lowest point early
  { distance: 7, elevation: 270 },
  { distance: 8, elevation: 280 }, // Natick - slight rise
  { distance: 9, elevation: 290 },
  { distance: 10, elevation: 300 }, // Wellesley screaming tunnel
  { distance: 11, elevation: 320 },
  { distance: 12, elevation: 340 },
  { distance: 13, elevation: 360 }, // Halfway - start of Newton hills approach
  { distance: 14, elevation: 380 },
  { distance: 15, elevation: 400 },
  { distance: 16, elevation: 450 }, // Newton Lower Falls - first Newton hill
  { distance: 17, elevation: 480 }, // Newton Upper Falls
  { distance: 17.5, elevation: 500 }, // Commonwealth Ave climb
  { distance: 18, elevation: 520 }, // Newton Highlands
  { distance: 19, elevation: 540 }, // Approaching Heartbreak Hill
  { distance: 20, elevation: 560 }, // Base of Heartbreak Hill
  { distance: 20.5, elevation: 580 }, // Heartbreak Hill peak
  { distance: 21, elevation: 560 }, // Cresting Heartbreak - Boston College
  { distance: 21.5, elevation: 540 }, // Start of descent
  { distance: 22, elevation: 480 }, // Cleveland Circle
  { distance: 23, elevation: 420 }, // Reservoir
  { distance: 24, elevation: 360 }, // Brookline
  { distance: 25, elevation: 300 }, // Kenmore Square area
  { distance: 26, elevation: 150 }, // Boylston Street
  { distance: 26.2, elevation: 30 }, // Boston finish line
]
