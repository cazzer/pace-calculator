import { calculateGrade, ElevationPoint, getAverageGrade } from '../elevation'
import { Unit } from '../types'

// ---- Constants ----
const MI_PER_KM = 1 / 1.609344 // ~0.621371
const KM_PER_MI = 1.609344

// ---- Utilities ----
export function parsePaceToSeconds(input: string): number | null {
  // Accepts "m:ss", "mm:ss", "h:mm:ss", or decimal minutes like "7.5"
  const trimmed = input.trim()
  if (!trimmed) return null

  // If it looks like a simple number, treat as minutes (decimal)
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const mins = parseFloat(trimmed)
    if (isNaN(mins) || mins < 0) return null
    return Math.round(mins * 60)
  }

  // h:mm:ss or mm:ss
  const parts = trimmed.split(':').map((p) => p.trim())
  if (parts.length === 2 || parts.length === 3) {
    let h = 0,
      m = 0,
      s = 0

    if (parts.length === 2) {
      ;[m, s] = parts.map((n) => Number(n))
      if ([m, s].some((n) => Number.isNaN(n) || n < 0 || !Number.isFinite(n)))
        return null
    } else {
      ;[h, m, s] = parts.map((n) => Number(n))
      if (
        [h, m, s].some((n) => Number.isNaN(n) || n < 0 || !Number.isFinite(n))
      )
        return null
    }

    if (m >= 60 || s >= 60) return null
    const total = h * 3600 + m * 60 + s
    return total >= 0 ? total : null
  }

  return null
}

export function formatHMS(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '—'
  const secs = Math.round(totalSeconds)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60

  const mm = m.toString().padStart(2, '0')
  const ss = s.toString().padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

export function convertDistanceTo(
  targetUnit: Unit,
  value: number,
  fromUnit: Unit
): number {
  if (!Number.isFinite(value)) return NaN
  if (targetUnit === fromUnit) return value
  return targetUnit === 'mi' ? value * MI_PER_KM : value * KM_PER_MI
}

// Calculate grade statistics for a segment
export function calculateGradeStats(
  profile: ElevationPoint[],
  startDistance: number,
  endDistance: number
): { weightedAvg: number; min: number; max: number } {
  const relevantPoints = profile.filter(
    (p) => p.distance >= startDistance && p.distance <= endDistance
  )

  if (relevantPoints.length < 2) {
    const avg = getAverageGrade(profile, startDistance, endDistance)
    return { weightedAvg: avg, min: avg, max: avg }
  }

  let totalWeightedGrade = 0
  let totalDistance = 0
  const grades: number[] = []

  for (let i = 0; i < relevantPoints.length - 1; i++) {
    const p1 = relevantPoints[i]
    const p2 = relevantPoints[i + 1]
    const segmentDistance = p2.distance - p1.distance
    const segmentGrade = calculateGrade(p1, p2)

    totalWeightedGrade += segmentGrade * segmentDistance
    totalDistance += segmentDistance
    grades.push(segmentGrade)
  }

  const weightedAvg = totalDistance > 0 ? totalWeightedGrade / totalDistance : 0

  return {
    weightedAvg,
    min: Math.min(...grades),
    max: Math.max(...grades),
  }
}
