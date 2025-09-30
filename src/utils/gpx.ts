import { ElevationPoint } from '../types'

export interface GPXTrackPoint {
  latitude: number
  longitude: number
  elevation: number
  distance: number // cumulative distance in miles
}

export interface GPXData {
  name?: string
  trackPoints: GPXTrackPoint[]
  totalDistance: number // in miles
  elevationGain: number // in feet
  elevationLoss: number // in feet
}

// Conversion constant
const METERS_TO_FEET = 3.28084

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in miles
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Parse GPX file and extract elevation profile
 */
export function parseGPXFile(gpxContent: string): Promise<GPXData> {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(gpxContent, 'text/xml')

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        throw new Error('Invalid GPX file format')
      }

      // Extract track name
      const nameElement = xmlDoc.querySelector('trk name, metadata name')
      const name = nameElement?.textContent || undefined

      // Get all track points
      const trackPoints = xmlDoc.querySelectorAll('trkpt')

      if (trackPoints.length === 0) {
        throw new Error('No track points found in GPX file')
      }

      const points: GPXTrackPoint[] = []
      let cumulativeDistance = 0
      let totalElevationGain = 0
      let totalElevationLoss = 0
      let previousElevation: number | null = null

      trackPoints.forEach((point, index) => {
        const lat = parseFloat(point.getAttribute('lat') || '0')
        const lon = parseFloat(point.getAttribute('lon') || '0')
        const eleElement = point.querySelector('ele')
        const elevation = eleElement
          ? parseFloat(eleElement.textContent || '0') * METERS_TO_FEET
          : 0 // Convert meters to feet

        // Validate coordinates
        if (
          isNaN(lat) ||
          isNaN(lon) ||
          Math.abs(lat) > 90 ||
          Math.abs(lon) > 180
        ) {
          return // Skip invalid points
        }

        // Calculate distance from previous point
        if (index > 0 && points.length > 0) {
          const prevPoint = points[points.length - 1]
          const distance = calculateDistance(
            prevPoint.latitude,
            prevPoint.longitude,
            lat,
            lon
          )
          cumulativeDistance += distance
        }

        // Calculate elevation gain/loss
        if (previousElevation !== null && !isNaN(elevation)) {
          const elevationDiff = elevation - previousElevation
          if (elevationDiff > 0) {
            totalElevationGain += elevationDiff
          } else {
            totalElevationLoss += Math.abs(elevationDiff)
          }
        }

        points.push({
          latitude: lat,
          longitude: lon,
          elevation: isNaN(elevation) ? 0 : elevation,
          distance: cumulativeDistance,
        })

        previousElevation = isNaN(elevation) ? previousElevation : elevation
      })

      if (points.length < 2) {
        throw new Error('GPX file must contain at least 2 valid track points')
      }

      resolve({
        name,
        trackPoints: points,
        totalDistance: cumulativeDistance,
        elevationGain: totalElevationGain,
        elevationLoss: totalElevationLoss,
      })
    } catch (error) {
      reject(
        error instanceof Error ? error : new Error('Failed to parse GPX file')
      )
    }
  })
}

/**
 * Simplify track points using Douglas-Peucker algorithm to reduce data size
 */
export function simplifyTrackPoints(
  points: GPXTrackPoint[],
  tolerance: number = 0.001 // ~100 meters
): GPXTrackPoint[] {
  if (points.length <= 2) return points

  // Find the point with maximum distance from the line between first and last
  let maxDistance = 0
  let maxIndex = 0
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], firstPoint, lastPoint)
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const leftPoints = simplifyTrackPoints(
      points.slice(0, maxIndex + 1),
      tolerance
    )
    const rightPoints = simplifyTrackPoints(points.slice(maxIndex), tolerance)

    // Combine results (remove duplicate middle point)
    return [...leftPoints.slice(0, -1), ...rightPoints]
  }

  // Return just the endpoints
  return [firstPoint, lastPoint]
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(
  point: GPXTrackPoint,
  lineStart: GPXTrackPoint,
  lineEnd: GPXTrackPoint
): number {
  const A = point.latitude - lineStart.latitude
  const B = point.longitude - lineStart.longitude
  const C = lineEnd.latitude - lineStart.latitude
  const D = lineEnd.longitude - lineStart.longitude

  const dot = A * C + B * D
  const lenSq = C * C + D * D

  if (lenSq === 0) return Math.sqrt(A * A + B * B)

  const param = dot / lenSq
  let xx: number, yy: number

  if (param < 0) {
    xx = lineStart.latitude
    yy = lineStart.longitude
  } else if (param > 1) {
    xx = lineEnd.latitude
    yy = lineEnd.longitude
  } else {
    xx = lineStart.latitude + param * C
    yy = lineStart.longitude + param * D
  }

  const dx = point.latitude - xx
  const dy = point.longitude - yy
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Convert GPX track points to elevation profile format
 */
export function gpxToElevationProfile(
  gpxData: GPXData
): Array<{ distance: number; elevation: number }> {
  return gpxData.trackPoints.map((point) => ({
    distance: point.distance,
    elevation: point.elevation,
  }))
}
