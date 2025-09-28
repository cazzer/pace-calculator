// ---- Types ----
export type Unit = 'mi' | 'km'

// ---- Props Types ----
export type SplitsProps = {
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
}

export type UnitToggleProps = {
  value: Unit
  onChange: (u: Unit) => void
  idBase: string
}
