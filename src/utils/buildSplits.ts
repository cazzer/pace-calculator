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

// New interface for splits with elevation data but no target pace yet
interface ElevationEnhancedSplit extends SplitRow {
  elevation: number | null
  grade: number | null
  gradeRange: ReturnType<typeof calculateGradeStats> | null
  distanceInMiles: number
  prevDistanceInMiles: number
}

interface BuildSplitsOptions {
  totalDistance: number
  distanceUnit: 'mi' | 'km'
  paceUnit: 'mi' | 'km'
  paceSecondsPerUnit: number
  raceProfile?: RaceProfile | null
  pacingStrategy?: 'even-pace' | 'even-effort'
  isGoalTimeMode?: boolean // Add this to identify when we're calculating pace from time
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

function addElevationData(
  splits: SplitRow[],
  raceProfile: RaceProfile,
  paceUnit: 'mi' | 'km'
): ElevationEnhancedSplit[] {
  return splits.map((split, index) => {
    // Convert split distance to profile units (miles)
    const distanceMatch = split.distanceLabel.match(/([\d.]+)\s*(mi|km)/)
    let distanceInMiles: number

    if (distanceMatch) {
      const distanceValue = parseFloat(distanceMatch[1])
      const unit = distanceMatch[2]
      distanceInMiles = unit === 'mi' ? distanceValue : distanceValue / 1.609344
    } else {
      // This shouldn't happen with our current setup, but fallback just in case
      distanceInMiles = 0
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

    return {
      ...split,
      elevation: Math.round(elevation),
      grade: Math.round(gradeStats.weightedAvg * 10) / 10,
      gradeRange: gradeStats,
      distanceInMiles,
      prevDistanceInMiles,
    }
  })
}

function adjustTimingForEvenEffort(
  elevationSplits: ElevationEnhancedSplit[],
  totalDistance: number,
  distanceUnit: 'mi' | 'km',
  paceUnit: 'mi' | 'km',
  paceSecondsPerUnit: number,
  raceProfile: RaceProfile
): ElevationEnhancedSplit[] {
  // Calculate weighted average adjustment factor
  let totalWeightedAdjustment = 0
  let totalSegmentDistance = 0

  for (const split of elevationSplits) {
    if (!split.gradeRange) continue

    const adjustmentFactor =
      calculateActualPaceForTargetGAP(
        paceSecondsPerUnit,
        split.gradeRange.weightedAvg
      ) / paceSecondsPerUnit

    const segmentDistanceInMiles =
      split.distanceInMiles - split.prevDistanceInMiles
    totalWeightedAdjustment += adjustmentFactor * segmentDistanceInMiles
    totalSegmentDistance += segmentDistanceInMiles
  }

  const avgAdjustmentFactor = totalWeightedAdjustment / totalSegmentDistance
  const correctedPace = paceSecondsPerUnit / avgAdjustmentFactor

  // Recalculate timing with even-effort pacing
  let cumulativeTime = 0

  return elevationSplits.map((split) => {
    const segmentDistanceInMiles =
      split.distanceInMiles - split.prevDistanceInMiles

    if (segmentDistanceInMiles > 0 && split.gradeRange) {
      const segmentPace = calculateActualPaceForTargetGAP(
        correctedPace,
        split.gradeRange.weightedAvg
      )

      const segmentDistanceInPaceUnit = convertDistanceTo(
        paceUnit,
        segmentDistanceInMiles,
        'mi'
      )
      const segmentTime = segmentDistanceInPaceUnit * segmentPace

      cumulativeTime += segmentTime

      return {
        ...split,
        cumulativeSeconds: cumulativeTime,
        segmentSeconds: segmentTime,
      }
    } else {
      // For zero-distance segments (shouldn't happen), keep original timing
      cumulativeTime += split.segmentSeconds
      return split
    }
  })
}

function addTargetPaces(
  splits: ElevationEnhancedSplit[],
  paceSecondsPerUnit: number,
  paceUnit: 'mi' | 'km',
  pacingStrategy: 'even-pace' | 'even-effort'
): EnhancedSplit[] {
  return splits.map((split) => {
    let targetPace: number

    if (split.gradeRange) {
      if (pacingStrategy === 'even-pace') {
        targetPace = calculateGradeAdjustedPace(
          paceSecondsPerUnit,
          split.gradeRange.weightedAvg
        )
      } else {
        // For even-effort, calculate the actual pace from the segment timing
        const segmentDistanceInMiles =
          split.distanceInMiles - split.prevDistanceInMiles
        const segmentDistanceInPaceUnit = convertDistanceTo(
          paceUnit,
          segmentDistanceInMiles,
          'mi'
        )
        targetPace =
          segmentDistanceInPaceUnit > 0
            ? split.segmentSeconds / segmentDistanceInPaceUnit
            : paceSecondsPerUnit
      }
    } else {
      targetPace = paceSecondsPerUnit
    }

    // Remove the helper properties from the final result
    const { distanceInMiles, prevDistanceInMiles, ...finalSplit } = split

    return {
      ...finalSplit,
      targetPace,
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
  isGoalTimeMode = false,
}: BuildSplitsOptions): EnhancedSplit[] {
  // Early exit if no race profile
  if (!raceProfile) {
    const markers = buildSplitMarkers(totalDistance, distanceUnit)
    const sortedMarkers = deduplicateMarkers(markers)
    const splitRows = calculateSplitTimes(
      sortedMarkers,
      totalDistance,
      distanceUnit,
      paceUnit,
      paceSecondsPerUnit
    )

    // Return basic splits with no elevation data
    return splitRows.map((split) => ({
      ...split,
      elevation: null,
      grade: null,
      targetPace: paceSecondsPerUnit,
      gradeRange: null,
    }))
  }

  // Build basic split structure
  const markers = buildSplitMarkers(totalDistance, distanceUnit)
  const sortedMarkers = deduplicateMarkers(markers)
  let splitRows = calculateSplitTimes(
    sortedMarkers,
    totalDistance,
    distanceUnit,
    paceUnit,
    paceSecondsPerUnit
  )

  // First pass: add elevation data
  let elevationSplits = addElevationData(splitRows, raceProfile, paceUnit)

  // Second pass: adjust timing if even-effort + goal time
  if (pacingStrategy === 'even-effort' && isGoalTimeMode) {
    elevationSplits = adjustTimingForEvenEffort(
      elevationSplits,
      totalDistance,
      distanceUnit,
      paceUnit,
      paceSecondsPerUnit,
      raceProfile
    )
  }

  // Final pass: add target paces
  return addTargetPaces(
    elevationSplits,
    paceSecondsPerUnit,
    paceUnit,
    pacingStrategy
  )
}
