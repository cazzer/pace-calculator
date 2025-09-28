import React from 'react'
import { Unit } from './types'

interface PresetOptionsProps {
  onPacePreset: (paceSeconds: number, corral: string) => void
  onDistancePreset: (distance: number, unit: Unit) => void
  currentDistance: number
  currentDistanceUnit: Unit
  paceUnit: Unit
  currentPaceSeconds: number | null // Add current pace for comparison
}

export function PresetOptions({
  onPacePreset,
  onDistancePreset,
  currentDistance,
  currentDistanceUnit,
  paceUnit,
  currentPaceSeconds,
}: PresetOptionsProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Get the current distance in a standardized format for lookup
  const getCurrentDistanceKey = () => {
    if (!Number.isFinite(currentDistance)) return null

    // Convert to miles for consistent lookup
    const distanceInMiles =
      currentDistanceUnit === 'mi'
        ? currentDistance
        : currentDistance / 1.609344

    // Find matching NYRR distance (with tighter tolerance for precision)
    for (const [key, data] of Object.entries(NYRR_DISTANCE_FACTORS)) {
      if (Math.abs(distanceInMiles - data.miles) < 0.01) {
        return key
      }
    }
    return null
  }

  const distanceKey = getCurrentDistanceKey()
  const isNYRRDistance = distanceKey !== null
  const currentDistanceData = distanceKey
    ? NYRR_DISTANCE_FACTORS[distanceKey]
    : null

  // Calculate pace for current distance
  const calculatePaceForDistance = (pace10kSeconds: number) => {
    if (!currentDistanceData) return pace10kSeconds

    // For 10K, no conversion needed
    if (currentDistanceData.factor === 1.0) {
      return pace10kSeconds
    }

    // Convert 10K pace to 10K total time (10K = exactly 10km = 6.213712 miles)
    const total10kTime = pace10kSeconds * 6.213712

    // Apply NYRR factor - this gives us the predicted race time for the new distance
    const predictedRaceTime = total10kTime / currentDistanceData.factor

    // Convert back to per-mile pace for the current distance
    const paceForDistance = predictedRaceTime / currentDistanceData.miles

    return Math.floor(paceForDistance)
  }

  // Convert mile pace to km pace if needed
  const formatPaceForDisplay = (paceInSeconds: number) => {
    if (paceUnit === 'km') {
      // Convert per-mile pace to per-km pace
      const pacePerKm = paceInSeconds / 1.609344
      const minutes = Math.floor(pacePerKm / 60)
      const secs = Math.round(pacePerKm % 60)
      return `${minutes}:${secs.toString().padStart(2, '0')}/km`
    } else {
      return formatPace(paceInSeconds)
    }
  }

  // Convert pace for the onPacePreset callback
  const handlePacePreset = (calculatedPaceSeconds: number, corral: string) => {
    let paceToSet = calculatedPaceSeconds
    if (paceUnit === 'km') {
      // Convert from per-mile to per-km for the callback
      paceToSet = calculatedPaceSeconds / 1.609344
    }
    onPacePreset(Math.round(paceToSet), corral)
  }

  // Check if a pace preset is currently selected
  const isPaceSelected = (pace10kSeconds: number) => {
    if (currentPaceSeconds === null) return false

    const calculatedPace = calculatePaceForDistance(pace10kSeconds)
    let paceToCompare = calculatedPace

    if (paceUnit === 'km') {
      // Convert from per-mile to per-km for comparison
      paceToCompare = calculatedPace / 1.609344
    }

    // Allow for small rounding differences (within 1 second)
    return Math.abs(currentPaceSeconds - paceToCompare) <= 3
  }

  return (
    <div style={styles.moreOptionsSection}>
      <button
        style={styles.moreOptionsToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        More Options {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div style={styles.moreOptionsContent}>
          {/* NYRR Distance Presets */}
          <div style={styles.presetSection}>
            <h3 style={styles.presetHeader}>Common-ish Distances</h3>
            <div style={styles.distancePresets}>
              {Object.entries(NYRR_DISTANCE_FACTORS).map(([key, data]) => {
                const isSelected = distanceKey === key
                return (
                  <button
                    key={key}
                    style={{
                      ...styles.presetButton,
                      ...(isSelected ? styles.presetButtonActive : {}),
                    }}
                    onClick={() => onDistancePreset(data.miles, 'mi')}
                  >
                    {data.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* NYRR Pace Presets */}
          <div style={styles.presetSection}>
            <h3 style={styles.presetHeader}>
              NYRR Corral Paces
              {isNYRRDistance && currentDistanceData
                ? ` (for ${currentDistanceData.label})`
                : ''}
            </h3>

            {!isNYRRDistance ? (
              <div style={styles.errorMessage}>
                Please select an NYRR race distance above to see corral pace
                requirements.
              </div>
            ) : (
              <>
                <p style={styles.presetNote}>
                  Based on 10K pace requirements
                  {currentDistanceData
                    ? ` converted for ${currentDistanceData.label}`
                    : ''}
                  . See the{' '}
                  <a
                    href="https://www.nyrr.org/run/guidelines-and-procedures/policies-rules-and-regulations/best-pace-and-corral-updates"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    NYRR pace formula
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://help.nyrr.org/s/article/how-is-my-corral-assignment-determined2"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    corral pace cuts
                  </a>{' '}
                  for details.
                </p>

                <div style={styles.pacePresetGrid}>
                  {NYRR_PACE_PRESETS.map((preset) => {
                    const isSelected = isPaceSelected(preset.pace10kSeconds)
                    return (
                      <button
                        key={preset.corral}
                        style={{
                          ...styles.presetButton,
                          ...(isSelected ? styles.presetButtonActive : {}),
                        }}
                        onClick={() =>
                          handlePacePreset(
                            calculatePaceForDistance(preset.pace10kSeconds),
                            preset.corral
                          )
                        }
                      >
                        <div>
                          <div>
                            {preset.corral}:{' '}
                            {formatPaceForDisplay(
                              calculatePaceForDistance(preset.pace10kSeconds)
                            )}
                          </div>
                          <div style={styles.paceSource}>
                            from {formatPaceForDisplay(preset.pace10kSeconds)}{' '}
                            10K pace
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to format pace
const formatPace = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}/mi`
}

// NYRR distance factors and data
const NYRR_DISTANCE_FACTORS: Record<
  string,
  { label: string; miles: number; factor: number }
> = {
  '5K': { label: '5K', miles: 3.10686, factor: 2.09 },
  '4M': { label: '4 Miles', miles: 4.0, factor: 1.6 },
  '8K': { label: '8K', miles: 4.97097, factor: 1.27 },
  '5M': { label: '5 Miles', miles: 5.0, factor: 1.26 },
  '10K': { label: '10K', miles: 6.21371, factor: 1.0 },
  '12K': { label: '12K', miles: 7.45645, factor: 0.82 },
  '15K': { label: '15K', miles: 9.32057, factor: 0.65 },
  '10M': { label: '10 Miles', miles: 10.0, factor: 0.6 },
  '20K': { label: '20K', miles: 12.42742, factor: 0.48 },
  HM: { label: 'Half Marathon', miles: 13.1, factor: 0.45 },
  '25K': { label: '25K', miles: 15.53428, factor: 0.38 },
  '30K': { label: '30K', miles: 18.64114, factor: 0.31 },
  '20M': { label: '20 Miles', miles: 20.0, factor: 0.29 },
  M: { label: 'Marathon', miles: 26.2, factor: 0.22 },
}

// NYRR pace presets (10K pace requirements in seconds)
const NYRR_PACE_PRESETS = [
  { corral: 'AA Men', pace10kSeconds: 5 * 60 + 4 }, // 5:04/mi for 10K
  { corral: 'AA Women', pace10kSeconds: 6 * 60 + 19 }, // 6:19/mi for 10K
  { corral: 'AA Non-Binary', pace10kSeconds: 6 * 60 + 19 }, // 6:19/mi for 10K
  { corral: 'A', pace10kSeconds: 6 * 60 + 29 }, // 6:29/mi
  { corral: 'B', pace10kSeconds: 7 * 60 + 12 }, // 7:12/mi
  { corral: 'C', pace10kSeconds: 7 * 60 + 42 }, // 7:42/mi
  { corral: 'D', pace10kSeconds: 8 * 60 + 4 }, // 8:04/mi
  { corral: 'E', pace10kSeconds: 8 * 60 + 29 }, // 8:29/mi
  { corral: 'F', pace10kSeconds: 8 * 60 + 54 }, // 8:54/mi
  { corral: 'G', pace10kSeconds: 9 * 60 + 17 }, // 9:17/mi
  { corral: 'H', pace10kSeconds: 9 * 60 + 47 }, // 9:47/mi
  { corral: 'I', pace10kSeconds: 10 * 60 + 16 }, // 10:16/mi
  { corral: 'J', pace10kSeconds: 11 * 60 + 2 }, // 11:02/mi
  { corral: 'K', pace10kSeconds: 12 * 60 + 16 }, // 12:16/mi
  { corral: 'L', pace10kSeconds: 25 * 60 + 0 }, // 25:00/mi
]

const styles: Record<string, React.CSSProperties> = {
  moreOptionsSection: {
    marginTop: 16,
    width: '100%',
  },
  moreOptionsToggle: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moreOptionsContent: {
    marginTop: 8,
    padding: 16,
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    backgroundColor: 'var(--bg-card-alt)',
  },
  presetSection: {
    marginBottom: 24,
  },
  presetHeader: {
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: 'var(--text-primary)',
  },
  presetNote: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: 12,
    lineHeight: 1.4,
  },
  link: {
    color: 'var(--text-primary)',
    textDecoration: 'underline',
  },
  pacePresetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 8,
  },
  presetButton: {
    padding: '8px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    backgroundColor: 'var(--button-bg)',
    borderColor: 'var(--border-color)',
    color: 'var(--button-text)',
    fontSize: '0.9rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  presetButtonActive: {
    backgroundColor: 'var(--button-bg-active)',
    borderColor: 'var(--text-primary)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    color: 'var(--button-text-active)',
    fontWeight: 500,
  },
  distancePresets: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorMessage: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    color: '#dc2626',
    fontSize: '0.9rem',
    marginBottom: 12,
  },
  paceSource: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginTop: 2,
  },
}
