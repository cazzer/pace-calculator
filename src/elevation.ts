import {
  NYC_MARATHON_ELEVATION,
  CHICAGO_MARATHON_ELEVATION,
  BOSTON_MARATHON_ELEVATION,
  LONDON_MARATHON_ELEVATION,
  BERLIN_MARATHON_ELEVATION,
  TOKYO_MARATHON_ELEVATION,
  SYDNEY_MARATHON_ELEVATION,
  UNITED_NYC_HALF_ELEVATION,
} from './assets/elevationData'
import { RaceProfile, ElevationPoint } from './types'
import { minetti2002CostOfRunning } from './utils/common'

export const RACE_PROFILES: Record<string, RaceProfile> = {
  'boston-marathon': {
    name: 'Boston Marathon',
    distance: 26.2,
    unit: 'mi',
    elevationProfile: BOSTON_MARATHON_ELEVATION,
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/en/0/0c/Boston_Marathon_logo_%28updated_2024%29.png?20250420000148',
    gpxUrl: 'https://www.strava.com/routes/3408689556698886246',
  }, // 1897 - oldest
  'united-nyc-half': {
    name: 'United NYC Half Marathon',
    distance: 13.1,
    unit: 'mi',
    elevationProfile: UNITED_NYC_HALF_ELEVATION,
    logoUrl:
      'https://raceraves.com/wp-content/uploads/2022/09/uanych18_4p_primary_logo_nodate_rgb_full_color300x300.png',
    gpxUrl: 'https://www.strava.com/routes/3334559585706062360',
  },
  'nyc-marathon': {
    name: 'NYC Marathon',
    distance: 26.2,
    unit: 'mi',
    elevationProfile: NYC_MARATHON_ELEVATION,
    logoUrl:
      'https://prodsitecorehaku01-image.nyrr.org/nyrrsitecoreblob/nyrr/logo/homepage_mara_logo_nycm_horizontallogo_fc_rgb.png?width=400&height=400',
    gpxUrl: 'https://www.strava.com/routes/3271509816084244646',
  }, // 1970
  'chicago-marathon': {
    name: 'Chicago Marathon',
    distance: 26.2,
    unit: 'mi',
    elevationProfile: CHICAGO_MARATHON_ELEVATION,
    logoUrl:
      'https://www.chicagomarathon.com/wp-content/themes/cm/images/logo.svg?v=2',
    gpxUrl: 'https://www.strava.com/routes/3274142304814937750',
  }, // 1977
  'london-marathon': {
    name: 'London Marathon',
    distance: 26.2,
    unit: 'mi',
    elevationProfile: LONDON_MARATHON_ELEVATION,
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/en/2/26/TCS_London_Marathon_logo.png',
    gpxUrl: 'https://www.strava.com/routes/3340238562613360862',
  }, // 1981
  'berlin-marathon': {
    name: 'Berlin Marathon',
    distance: 26.2,
    unit: 'mi',
    elevationProfile: BERLIN_MARATHON_ELEVATION,
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/en/thumb/6/66/BMW_Berlin_Marathon_logo.svg/2560px-BMW_Berlin_Marathon_logo.svg.png',
    gpxUrl: 'https://www.strava.com/routes/3408692901540914278',
  }, // 1981 (same year as London, but started later in the year)
  'tokyo-marathon': {
    name: 'Tokyo Marathon',
    distance: 26.2,
    unit: 'mi',
    elevationProfile: TOKYO_MARATHON_ELEVATION,
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Tokyo_Marathon_logo.svg/1280px-Tokyo_Marathon_logo.svg.png',
    gpxUrl: 'https://www.strava.com/routes/3408692524761307238', // You can populate this with the Strava route or GPX file URL
  }, // 2007
  'sydney-marathon': {
    name: 'Sydney Marathon',
    distance: 26.2,
    unit: 'mi',
    elevationProfile: SYDNEY_MARATHON_ELEVATION,
    logoUrl:
      'https://childrenofperu.org/wp-content/uploads/2024/11/tcs-sydney-logo.png',
    gpxUrl: 'https://www.strava.com/routes/3408686440096672870',
  }, // 2001, but became World Major in 2023
}

// Calculate grade between two elevation points
export function calculateGrade(
  point1: ElevationPoint,
  point2: ElevationPoint
): number {
  const horizontalDistance = (point2.distance - point1.distance) * 5280 // Convert miles to feet
  const elevationChange = point2.elevation - point1.elevation // Already in feet

  if (horizontalDistance <= 0) return 0

  return (elevationChange / horizontalDistance) * 100 // Convert to percentage
}

// Get elevation at a specific distance using linear interpolation
export function getElevationAtDistance(
  profile: ElevationPoint[],
  distance: number
): number {
  if (distance <= profile[0].distance) return profile[0].elevation
  if (distance >= profile[profile.length - 1].distance)
    return profile[profile.length - 1].elevation

  for (let i = 0; i < profile.length - 1; i++) {
    const p1 = profile[i]
    const p2 = profile[i + 1]

    if (distance >= p1.distance && distance <= p2.distance) {
      const ratio = (distance - p1.distance) / (p2.distance - p1.distance)
      return p1.elevation + (p2.elevation - p1.elevation) * ratio
    }
  }

  return profile[0].elevation
}

// Calculate Grade Adjusted Pace (GAP) using Minetti 2002 research
// Based on metabolic cost of running at different grades
export function calculateGradeAdjustedPace(
  basePaceSeconds: number,
  gradePercent: number
): number {
  if (Math.abs(gradePercent) < 0.1) return basePaceSeconds // Flat terrain

  // Convert percentage to decimal for Minetti formula
  const gradeDecimal = gradePercent / 100

  // Get metabolic costs
  const levelCost = minetti2002CostOfRunning(0)
  const gradeCost = minetti2002CostOfRunning(gradeDecimal)

  // Adjustment factor based on relative metabolic cost
  const adjustmentFactor = gradeCost / levelCost

  return basePaceSeconds * adjustmentFactor
}

// Calculate what actual pace is needed to achieve a target Grade Adjusted Pace
// This is the inverse of calculateGradeAdjustedPace using Minetti 2002
export function calculateActualPaceForTargetGAP(
  targetGAPSeconds: number,
  gradePercent: number
): number {
  if (Math.abs(gradePercent) < 0.1) return targetGAPSeconds // Flat terrain

  // Convert percentage to decimal for Minetti formula
  const gradeDecimal = gradePercent / 100

  // Get metabolic costs
  const levelCost = minetti2002CostOfRunning(0)
  const gradeCost = minetti2002CostOfRunning(gradeDecimal)

  // Adjustment factor based on relative metabolic cost
  const adjustmentFactor = gradeCost / levelCost

  // To maintain the same effort (GAP), we need to adjust the actual pace inversely
  return targetGAPSeconds / adjustmentFactor
}

// Get average grade for a distance segment
export function getAverageGrade(
  profile: ElevationPoint[],
  startDistance: number,
  endDistance: number
): number {
  if (startDistance >= endDistance) return 0

  const startElevation = getElevationAtDistance(profile, startDistance)
  const endElevation = getElevationAtDistance(profile, endDistance)

  const distanceFeet = (endDistance - startDistance) * 5280
  const elevationChange = endElevation - startElevation

  return distanceFeet > 0 ? (elevationChange / distanceFeet) * 100 : 0
}

// Generate SVG sparkline for elevation profile with global scaling
export function generateElevationSparkline(
  profile: ElevationPoint[],
  width: number = 60,
  height: number = 20,
  globalScale: boolean = true
): string {
  if (profile.length < 2) return ''

  let minElevation: number
  let maxElevation: number

  if (globalScale) {
    // Use global min/max across all race profiles for consistent scaling
    const allElevations = Object.values(RACE_PROFILES).flatMap((race) =>
      race.elevationProfile.map((p) => p.elevation)
    )
    minElevation = Math.min(...allElevations)
    maxElevation = Math.max(...allElevations)
  } else {
    // Use local min/max for this profile only (old behavior)
    const elevations = profile.map((p) => p.elevation)
    minElevation = Math.min(...elevations)
    maxElevation = Math.max(...elevations)
  }

  const elevationRange = Math.max(maxElevation - minElevation, 1) // Avoid division by zero

  // Find distance range
  const minDistance = profile[0].distance
  const maxDistance = profile[profile.length - 1].distance
  const distanceRange = maxDistance - minDistance

  // Generate SVG path points
  const points = profile
    .map((point) => {
      const x = ((point.distance - minDistance) / distanceRange) * width
      const y =
        height - ((point.elevation - minElevation) / elevationRange) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
      <polyline 
        points="${points}" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="1.5" 
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
  `.trim()
}
