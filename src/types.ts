// ---- Types ----
export type Unit = 'mi' | 'km'

// Import from elevation to avoid duplication
import { RaceProfile } from './elevation'
export type { RaceProfile } from './elevation'

export interface SplitsProps {
  /** Pace in seconds per selected paceUnit (mi or km) */
  paceSecondsPerUnit: number | null
  /** The unit that the pace is keyed to (per mile or per km) */
  paceUnit: Unit
  /** Total race distance in distanceUnit */
  totalDistance: number
  /** The unit of the total distance (mi or km) */
  distanceUnit: Unit
  /** Optional: show per-segment times column */
  showSegmentTimes?: boolean
  /** Optional: race profile information */
  raceProfile?: RaceProfile | null
  /** Optional: pacing strategy, either 'even-pace' or 'even-effort' */
  pacingStrategy?: 'even-pace' | 'even-effort'
  calcMode: 'time' | 'pace'
}

export interface UnitToggleProps {
  value: Unit
  onChange: (unit: Unit) => void
  idBase: string
}
