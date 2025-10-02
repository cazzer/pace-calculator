import {
  convertDistanceTo,
  calculateGradeStats,
  minetti2002CostOfRunning,
} from './common'
import {
  calculateGradeAdjustedPace,
  getElevationAtDistance,
} from '../elevation'
import { RaceProfile } from '../types'

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
  calculatedPace?: number // Store the pace calculated during even-effort timing
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

function addEvenEffortTargetPaces(
  splits: ElevationEnhancedSplit[],
  paceSecondsPerUnit: number,
  paceUnit: 'mi' | 'km',
  totalDistance: number,
  distanceUnit: 'mi' | 'km'
): EnhancedSplit[] {
  // Calculate metabolic cost for each segment and race average
  let totalMetabolicWeight = 0
  let totalDistanceInMiles = 0

  const metabolicSplits = splits.map((split) => {
    const segmentDistanceInMiles =
      split.distanceInMiles - split.prevDistanceInMiles

    if (!split.gradeRange || segmentDistanceInMiles <= 0) {
      return { ...split, metabolicCost: 1.0, segmentWeight: 0 }
    }

    // Get metabolic cost from grade using Minetti 2002 model
    const gradeDecimal = split.gradeRange.weightedAvg / 100
    const metabolicCost = minetti2002CostOfRunning(gradeDecimal)

    // Calculate this segment's contribution to total metabolic load
    const segmentWeight = segmentDistanceInMiles * metabolicCost
    totalMetabolicWeight += segmentWeight
    totalDistanceInMiles += segmentDistanceInMiles

    return {
      ...split,
      metabolicCost,
      segmentWeight,
      segmentDistanceInMiles,
    }
  })

  // Validation: ensure we have meaningful data
  if (totalMetabolicWeight <= 0 || totalDistanceInMiles <= 0) {
    console.warn(
      'Invalid metabolic cost data - falling back to even pace strategy'
    )
    return addEvenPaceTargetPaces(splits, paceSecondsPerUnit)
  }

  // Calculate race average metabolic cost
  const averageMetabolicCost = totalMetabolicWeight / totalDistanceInMiles

  // PASS 1: Calculate natural effort-based paces and total time
  let naturalTotalTime = 0
  const naturalPaces = metabolicSplits.map((split) => {
    if (split.segmentDistanceInMiles && split.segmentDistanceInMiles > 0) {
      // Calculate effort ratio compared to race average
      const effortRatio = split.metabolicCost / averageMetabolicCost

      // Apply pace adjustment based on effort ratio (±30% variation)
      const paceAdjustmentFactor = 0.7 + effortRatio * 0.6
      const naturalPace = paceSecondsPerUnit * paceAdjustmentFactor

      // Calculate segment time with natural pace
      const segmentDistanceInPaceUnit = convertDistanceTo(
        paceUnit,
        split.segmentDistanceInMiles,
        'mi'
      )
      const naturalSegmentTime = naturalPace * segmentDistanceInPaceUnit
      naturalTotalTime += naturalSegmentTime

      return {
        ...split,
        naturalPace,
        naturalSegmentTime,
        segmentDistanceInPaceUnit,
      }
    } else {
      // Zero-distance segments
      const naturalSegmentTime = split.segmentSeconds
      naturalTotalTime += naturalSegmentTime
      return {
        ...split,
        naturalPace: paceSecondsPerUnit,
        naturalSegmentTime,
        segmentDistanceInPaceUnit: 0,
      }
    }
  })

  // PASS 2: Calculate global scaling factor to hit target time
  const targetTotalDistanceInPaceUnit = convertDistanceTo(
    paceUnit,
    totalDistance,
    distanceUnit
  )
  const targetTotalTime = targetTotalDistanceInPaceUnit * paceSecondsPerUnit
  const globalScalingFactor = naturalTotalTime / targetTotalTime

  // PASS 3: Apply scaled paces to achieve exact goal time
  let cumulativeTime = 0

  return naturalPaces.map((split) => {
    let targetPace: number
    let newSegmentSeconds: number

    if (split.segmentDistanceInPaceUnit > 0) {
      // Scale the natural pace to hit goal time while preserving effort distribution
      targetPace = split.naturalPace / globalScalingFactor
      newSegmentSeconds = targetPace * split.segmentDistanceInPaceUnit
    } else {
      // Zero-distance segments keep baseline pace
      targetPace = paceSecondsPerUnit
      newSegmentSeconds = split.segmentSeconds
    }

    cumulativeTime += newSegmentSeconds

    // Remove helper properties and return final split
    const {
      distanceInMiles,
      prevDistanceInMiles,
      metabolicCost,
      segmentWeight,
      segmentDistanceInMiles,
      naturalPace,
      naturalSegmentTime,
      segmentDistanceInPaceUnit,
      ...finalSplit
    } = split

    return {
      ...finalSplit,
      cumulativeSeconds: cumulativeTime,
      segmentSeconds: newSegmentSeconds,
      targetPace,
    }
  })
}

function addEvenPaceTargetPaces(
  splits: ElevationEnhancedSplit[],
  paceSecondsPerUnit: number
): EnhancedSplit[] {
  // For even-pace or non-goal-time mode, just calculate target paces
  return splits.map((split) => {
    let targetPace: number

    if (split.gradeRange) {
      targetPace = calculateGradeAdjustedPace(
        paceSecondsPerUnit,
        split.gradeRange.weightedAvg
      )
    } else {
      targetPace = paceSecondsPerUnit
    }

    // Remove helper properties
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

  // Final pass: add target paces (and adjust timing if needed)
  if (pacingStrategy === 'even-effort' && isGoalTimeMode) {
    return addEvenEffortTargetPaces(
      elevationSplits,
      paceSecondsPerUnit,
      paceUnit,
      totalDistance,
      distanceUnit
    )
  } else {
    return addEvenPaceTargetPaces(elevationSplits, paceSecondsPerUnit)
  }
}
