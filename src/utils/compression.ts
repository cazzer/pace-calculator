/**
 * Compress elevation profile data for URL storage
 * Uses a simple delta encoding + base64 approach
 */
export function compressElevationData(
  profile: Array<{ distance: number; elevation: number }>
): string {
  if (profile.length === 0) return ''

  // Convert to deltas for better compression
  const deltas: number[] = []
  let prevDistance = 0
  let prevElevation = 0

  for (const point of profile) {
    // Scale and round to reduce precision
    const distance = Math.round(point.distance * 1000) // 3 decimal places
    const elevation = Math.round(point.elevation)

    deltas.push(distance - prevDistance)
    deltas.push(elevation - prevElevation)

    prevDistance = distance
    prevElevation = elevation
  }

  // Convert to binary string (simple approach)
  const binaryString = deltas.map((d) => d.toString()).join(',')

  // Base64 encode
  try {
    return btoa(binaryString)
  } catch {
    throw new Error('Failed to compress elevation data')
  }
}

/**
 * Decompress elevation profile data from URL
 */
export function decompressElevationData(
  compressed: string
): Array<{ distance: number; elevation: number }> {
  if (!compressed) return []

  try {
    // Base64 decode
    const binaryString = atob(compressed)
    const deltas = binaryString.split(',').map(Number)

    if (deltas.length % 2 !== 0) {
      throw new Error('Invalid compressed data format')
    }

    // Reconstruct original values
    const profile: Array<{ distance: number; elevation: number }> = []
    let distance = 0
    let elevation = 0

    for (let i = 0; i < deltas.length; i += 2) {
      distance += deltas[i]
      elevation += deltas[i + 1]

      profile.push({
        distance: distance / 1000, // Convert back to decimal places
        elevation: elevation,
      })
    }

    return profile
  } catch {
    throw new Error('Failed to decompress elevation data')
  }
}

/**
 * Generate a hash for the elevation data (for localStorage key)
 */
export function generateElevationHash(
  profile: Array<{ distance: number; elevation: number }>
): string {
  // Simple hash based on first few points and total length
  const sample = profile.slice(0, 5).concat(profile.slice(-2))
  const hashString =
    sample.map((p) => `${p.distance.toFixed(3)},${p.elevation}`).join('|') +
    `|${profile.length}`

  // Simple hash function
  let hash = 0
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36)
}
