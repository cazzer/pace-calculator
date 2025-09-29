import { convertDistanceTo, calculateGradeStats } from './common'
import {
  RaceProfile,
  calculateGradeAdjustedPace,
  getElevationAtDistance,
  calculateActualPaceForTargetGAP,
} from '../elevation'

export interface SplitMarker {
  label: string
  distanceInDistanceUnit: number
  priority: number
}

export interface SplitRow {
  label: string
  distanceLabel: string // e.g., "3.11 mi" or "5.00 km"
  cumulativeSeconds: number // time from start to this marker
  segmentSeconds: number // time from previous marker to this marker
  priority: number // priority for styling
}

export interface EnhancedSplit extends SplitRow {
  elevation: number | null
  grade: number | null
  targetPace: number | null
  gradeRange: ReturnType<typeof calculateGradeStats> | null
}

interface BuildSplitsOptions {
  totalDistance: number
  distanceUnit: 'mi' | 'km'
  paceUnit: 'mi' | 'km'
  paceSecondsPerUnit: number
  raceProfile?: RaceProfile | null
  pacingStrategy?: 'even-pace' | 'even-effort'
}

export function buildSplitMarkers(
  totalDistance: number,
  distanceUnit: 'mi' | 'km'
): SplitMarker[] {
  const markers: SplitMarker[] = []
  const EPS = 1e-6

  // 1) Whole-unit splits
  const wholeMax = Math.floor(totalDistance + EPS)
  for (let i = 1; i <= wholeMax; i++) {
    markers.push({
      label: distanceUnit === 'mi' ? `Mile ${i}` : `${i} km`,
      distanceInDistanceUnit: i,
      priority: 2, // normal priority
    })
  }

  // 2) 5K splits (operate in km, convert to distanceUnit for labeling & calc)
  const totalKm = convertDistanceTo('km', totalDistance, distanceUnit)
  const fiveKCount = Math.floor(totalKm / 5 + EPS)
  for (let k = 1; k <= fiveKCount; k++) {
    const kmAtMark = k * 5 // 5, 10, 15...
    const distInDistanceUnit = convertDistanceTo(distanceUnit, kmAtMark, 'km')
    markers.push({
      label: `${kmAtMark}K`,
      distanceInDistanceUnit: distInDistanceUnit,
      priority: 1, // higher priority label if coincident with a whole split
    })
  }

  // 3) Halfway split
  const halfway = totalDistance / 2
  markers.push({
    label: 'Halfway',
    distanceInDistanceUnit: halfway,
    priority: 0, // highest priority label if duplicates overlap
  })

  return markers
}

export function deduplicateMarkers(markers: SplitMarker[]): SplitMarker[] {
  const EPS = 1e-4

  // Deduplicate by distance within EPS; keep the highest-priority label
  const dedupMap = new Map<number, SplitMarker>()

  for (const marker of markers) {
    // Normalize distance to a rounded key to handle floating-point
    const key = Math.round(marker.distanceInDistanceUnit / EPS) * EPS
    const existing = dedupMap.get(key)

    if (!existing || marker.priority < existing.priority) {
      dedupMap.set(key, {
        label: marker.label,
        distanceInDistanceUnit: marker.distanceInDistanceUnit,
        priority: marker.priority,
      })
    }
  }

  // Sort ascending by distance
  return Array.from(dedupMap.values()).sort(
    (a, b) => a.distanceInDistanceUnit - b.distanceInDistanceUnit
  )
}

export function calculateSplitTimes(
  markers: SplitMarker[],
  totalDistance: number,
  distanceUnit: 'mi' | 'km',
  paceUnit: 'mi' | 'km',
  paceSecondsPerUnit: number
): SplitRow[] {
  const rows: SplitRow[] = []
  let prevDistanceInPaceUnit = 0

  for (const marker of markers) {
    const dLabelNum = marker.distanceInDistanceUnit

    // Convert the marker distance into the "pace unit" to compute time
    const markerDistanceInPaceUnit = convertDistanceTo(
      paceUnit,
      marker.distanceInDistanceUnit,
      distanceUnit
    )

    const cumulativeSeconds = markerDistanceInPaceUnit * paceSecondsPerUnit
    const segmentDistanceInPaceUnit = Math.max(
      0,
      markerDistanceInPaceUnit - prevDistanceInPaceUnit
    )
    const segmentSeconds = segmentDistanceInPaceUnit * paceSecondsPerUnit

    rows.push({
      label: marker.label,
      distanceLabel:
        distanceUnit === 'mi'
          ? `${dLabelNum.toFixed(2)} mi`
          : `${dLabelNum.toFixed(2)} km`,
      cumulativeSeconds,
      segmentSeconds,
      priority: marker.priority,
    })

    prevDistanceInPaceUnit = markerDistanceInPaceUnit
  }

  // Add final finish line if the last marker is not exactly the total distance
  const lastDistance = markers.length
    ? markers[markers.length - 1].distanceInDistanceUnit
    : 0
  if (Math.abs(lastDistance - totalDistance) > 1e-4) {
    const totalInPaceUnit = convertDistanceTo(
      paceUnit,
      totalDistance,
      distanceUnit
    )
    const seg = Math.max(0, totalInPaceUnit - prevDistanceInPaceUnit)

    rows.push({
      label: 'Finish',
      distanceLabel:
        distanceUnit === 'mi'
          ? `${totalDistance.toFixed(2)} mi`
          : `${totalDistance.toFixed(2)} km`,
      cumulativeSeconds: totalInPaceUnit * paceSecondsPerUnit,
      segmentSeconds: seg * paceSecondsPerUnit,
      priority: 3, // lowest priority for finish line
    })
  }

  return rows
}

export function enhanceWithElevation(
  splits: SplitRow[],
  raceProfile: RaceProfile | null,
  paceUnit: 'mi' | 'km',
  paceSecondsPerUnit: number,
  pacingStrategy: 'even-pace' | 'even-effort'
): EnhancedSplit[] {
  return splits.map((split, index) => {
    if (!raceProfile) {
      return {
        ...split,
        elevation: null,
        grade: null,
        targetPace: null,
        gradeRange: null,
      }
    }

    // Convert split distance to profile units (miles)
    let distanceInMiles: number
    const distanceMatch = split.distanceLabel.match(/([\d.]+)\s*(mi|km)/)

    if (distanceMatch) {
      const distanceValue = parseFloat(distanceMatch[1])
      const unit = distanceMatch[2]
      distanceInMiles = unit === 'mi' ? distanceValue : distanceValue / 1.609344
    } else {
      // Fallback: calculate from pace and time
      const distanceInPaceUnits = split.cumulativeSeconds / paceSecondsPerUnit
      distanceInMiles =
        paceUnit === 'mi' ? distanceInPaceUnits : distanceInPaceUnits / 1.609344
    }

    // Get previous distance for grade calculation
    let prevDistanceInMiles = 0
    if (index > 0) {
      const prevSplit = splits[index - 1]
      const prevDistanceMatch =
        prevSplit.distanceLabel.match(/([\d.]+)\s*(mi|km)/)

      if (prevDistanceMatch) {
        const prevDistanceValue = parseFloat(prevDistanceMatch[1])
        const prevUnit = prevDistanceMatch[2]
        prevDistanceInMiles =
          prevUnit === 'mi' ? prevDistanceValue : prevDistanceValue / 1.609344
      } else {
        const prevDistanceInPaceUnits =
          prevSplit.cumulativeSeconds / paceSecondsPerUnit
        prevDistanceInMiles =
          paceUnit === 'mi'
            ? prevDistanceInPaceUnits
            : prevDistanceInPaceUnits / 1.609344
      }
    }

    const elevation = getElevationAtDistance(
      raceProfile.elevationProfile,
      distanceInMiles
    )
    const gradeStats = calculateGradeStats(
      raceProfile.elevationProfile,
      prevDistanceInMiles,
      distanceInMiles
    )

    // Calculate target pace based on pacing strategy
    let targetPace: number
    if (pacingStrategy === 'even-pace') {
      // Show what the pace will feel like (GAP)
      targetPace = calculateGradeAdjustedPace(
        paceSecondsPerUnit,
        gradeStats.weightedAvg
      )
    } else {
      // Show what actual pace to run for consistent effort
      targetPace = calculateActualPaceForTargetGAP(
        paceSecondsPerUnit,
        gradeStats.weightedAvg
      )
    }

    return {
      ...split,
      elevation: Math.round(elevation),
      grade: Math.round(gradeStats.weightedAvg * 10) / 10,
      targetPace,
      gradeRange: gradeStats,
    }
  })
}

export function buildSplits({
  totalDistance,
  distanceUnit,
  paceUnit,
  paceSecondsPerUnit,
  raceProfile = null,
  pacingStrategy = 'even-pace',
}: BuildSplitsOptions): EnhancedSplit[] {
  // Build and deduplicate markers
  const markers = buildSplitMarkers(totalDistance, distanceUnit)
  const sortedMarkers = deduplicateMarkers(markers)

  // Calculate times
  const splitRows = calculateSplitTimes(
    sortedMarkers,
    totalDistance,
    distanceUnit,
    paceUnit,
    paceSecondsPerUnit
  )

  // Enhance with elevation data if available
  return enhanceWithElevation(
    splitRows,
    raceProfile,
    paceUnit,
    paceSecondsPerUnit,
    pacingStrategy
  )
}
