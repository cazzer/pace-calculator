import { ElevationPoint } from '../elevation'

// London Marathon elevation profile - Relatively flat and fast course
// One of the flattest World Marathon Majors with only minor undulations
export const LONDON_MARATHON_ELEVATION: ElevationPoint[] = [
  { distance: 0, elevation: 130 }, // Greenwich start
  { distance: 1, elevation: 125 }, // Early slight downhill
  { distance: 2, elevation: 120 },
  { distance: 3, elevation: 115 }, // Blackheath area
  { distance: 4, elevation: 110 },
  { distance: 5, elevation: 105 }, // Woolwich
  { distance: 6, elevation: 100 },
  { distance: 7, elevation: 95 }, // Greenwich Maritime
  { distance: 8, elevation: 90 },
  { distance: 9, elevation: 85 }, // Isle of Dogs approach
  { distance: 10, elevation: 80 },
  { distance: 11, elevation: 75 }, // Canary Wharf area
  { distance: 12, elevation: 70 },
  { distance: 13, elevation: 65 }, // Halfway - Tower Bridge approach
  { distance: 14, elevation: 60 }, // Tower Bridge
  { distance: 15, elevation: 55 }, // Thames path
  { distance: 16, elevation: 50 },
  { distance: 17, elevation: 45 }, // Bermondsey
  { distance: 18, elevation: 40 },
  { distance: 19, elevation: 35 }, // Surrey Quays
  { distance: 20, elevation: 30 },
  { distance: 21, elevation: 25 }, // Rotherhithe
  { distance: 22, elevation: 20 },
  { distance: 23, elevation: 25 }, // Slight rise through Wapping
  { distance: 24, elevation: 30 }, // The Highway
  { distance: 25, elevation: 35 }, // Final approach
  { distance: 26, elevation: 40 }, // The Mall approach
  { distance: 26.2, elevation: 45 }, // The Mall finish
]
