import { ElevationPoint } from '../elevation'

// Chicago Marathon elevation profile - notably flat course with very minor elevation changes
// One of the flattest major marathons, with only ~30 feet total elevation change
export const CHICAGO_MARATHON_ELEVATION: ElevationPoint[] = [
  { distance: 0, elevation: 595 }, // Grant Park start
  { distance: 1, elevation: 598 },
  { distance: 2, elevation: 600 },
  { distance: 3, elevation: 602 },
  { distance: 4, elevation: 599 },
  { distance: 5, elevation: 597 },
  { distance: 6, elevation: 595 },
  { distance: 7, elevation: 593 },
  { distance: 8, elevation: 591 },
  { distance: 9, elevation: 589 },
  { distance: 10, elevation: 587 }, // Slight downhill through Lincoln Park
  { distance: 11, elevation: 585 },
  { distance: 12, elevation: 583 },
  { distance: 13, elevation: 581 }, // Halfway point
  { distance: 14, elevation: 580 },
  { distance: 15, elevation: 578 },
  { distance: 16, elevation: 576 },
  { distance: 17, elevation: 575 },
  { distance: 18, elevation: 577 }, // Slight rise in Pilsen
  { distance: 19, elevation: 579 },
  { distance: 20, elevation: 582 },
  { distance: 21, elevation: 585 },
  { distance: 22, elevation: 588 },
  { distance: 23, elevation: 591 },
  { distance: 24, elevation: 594 },
  { distance: 25, elevation: 597 },
  { distance: 26, elevation: 600 },
  { distance: 26.2, elevation: 601 }, // Grant Park finish
]
