import { Unit } from './types'

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
