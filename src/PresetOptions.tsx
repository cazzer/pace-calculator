import React from 'react'
import { Unit } from './types'
import {
  RACE_PROFILES,
  RaceProfile,
  generateElevationSparkline,
} from './elevation'
import { parseUrlParams } from './hashRouter'
import { QualifyingTimesSection } from './components/QualifyingTimesSection'
import { RacePresetsSection } from './components/RacePresetsSection'

interface PresetOptionsProps {
  onPacePreset: (paceSeconds: number, corral: string) => void
  onDistancePreset: (distance: number, unit: Unit) => void
  onRacePreset: (raceProfile: RaceProfile) => void
  onClearRace: () => void
  currentDistance: number
  currentDistanceUnit: Unit
  paceUnit: Unit
  currentPaceSeconds: number | null
  raceProfile: RaceProfile | null
  pacingStrategy: 'even-pace' | 'even-effort'
  onPacingStrategyChange: (strategy: 'even-pace' | 'even-effort') => void
}

export function PresetOptions({
  onPacePreset,
  onDistancePreset,
  onRacePreset,
  onClearRace,
  currentDistance,
  currentDistanceUnit,
  paceUnit,
  currentPaceSeconds,
  raceProfile,
  pacingStrategy,
  onPacingStrategyChange,
}: PresetOptionsProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activePaceSection, setActivePaceSection] = React.useState<
    string | null
  >(null)

  // Parse current URL params for highlighting
  const urlState = parseUrlParams(window.location.search.slice(1))

  // Force re-render when URL changes
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  React.useEffect(() => {
    const handlePopState = () => forceUpdate()
    window.addEventListener('popstate', handlePopState)

    const handleUrlChange = () => forceUpdate()
    const originalReplaceState = window.history.replaceState
    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args)
      handleUrlChange()
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.history.replaceState = originalReplaceState
    }
  }, [])

  // Handle distance preset click with race clearing
  const handleDistancePreset = (distance: number, unit: Unit) => {
    const matchingRace = Object.values(RACE_PROFILES).find(
      (race) => Math.abs(race.distance - distance) < 0.01 && race.unit === unit
    )

    if (!matchingRace && urlState.race) {
      onClearRace()
    }

    onDistancePreset(distance, unit)
  }

  // Check if a race preset is selected
  const isRaceSelected = React.useMemo(
    () => (raceKey: string) => {
      return urlState.race === raceKey
    },
    [urlState.race]
  )

  // Check if a distance preset is selected
  const isDistanceSelected = React.useMemo(
    () => (miles: number) => {
      if (!urlState.distance || !urlState.distanceUnit) return false

      const urlDistanceInMiles =
        urlState.distanceUnit === 'mi'
          ? urlState.distance
          : urlState.distance / 1.609344

      return Math.abs(urlDistanceInMiles - miles) < 0.01
    },
    [urlState.distance, urlState.distanceUnit]
  )

  // Get the current distance key for NYRR calculations
  const getCurrentDistanceKey = React.useMemo(() => {
    if (!urlState.distance || !urlState.distanceUnit) return null

    const distanceInMiles =
      urlState.distanceUnit === 'mi'
        ? urlState.distance
        : urlState.distance / 1.609344

    for (const [key, data] of Object.entries(NYRR_DISTANCE_FACTORS)) {
      if (Math.abs(distanceInMiles - data.miles) < 0.01) {
        return key
      }
    }
    return null
  }, [urlState.distance, urlState.distanceUnit])

  const distanceKey = getCurrentDistanceKey
  const isNYRRDistance = distanceKey !== null
  const currentDistanceData = distanceKey
    ? NYRR_DISTANCE_FACTORS[distanceKey]
    : null

  // Calculate pace for current distance
  const calculatePaceForDistance = (pace10kSeconds: number) => {
    if (!currentDistanceData) return pace10kSeconds

    if (currentDistanceData.factor === 1.0) {
      return pace10kSeconds
    }

    const total10kTime = pace10kSeconds * 6.213712
    const predictedRaceTime = total10kTime / currentDistanceData.factor
    const paceForDistance = predictedRaceTime / currentDistanceData.miles

    return Math.floor(paceForDistance)
  }

  // Convert mile pace to km pace if needed
  const formatPaceForDisplay = (paceInSeconds: number) => {
    if (paceUnit === 'km') {
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
      paceToSet = calculatedPaceSeconds / 1.609344
    }
    onPacePreset(Math.round(paceToSet), corral)
  }

  // Check if a pace preset is selected
  const isPaceSelected = React.useMemo(
    () => (pace10kSeconds: number) => {
      if (!urlState.pace || !currentDistanceData) return false

      const calculatedPace = calculatePaceForDistance(pace10kSeconds)
      let expectedPaceInUrl = calculatedPace

      if (urlState.paceUnit === 'km') {
        expectedPaceInUrl = calculatedPace / 1.609344
      }

      const urlPaceSeconds = parsePaceStringToSeconds(urlState.pace)
      if (urlPaceSeconds === null) return false

      return Math.abs(urlPaceSeconds - expectedPaceInUrl) <= 3
    },
    [urlState.pace, urlState.paceUnit, currentDistanceData]
  )

  const togglePaceSection = (sectionKey: string) => {
    setActivePaceSection(activePaceSection === sectionKey ? null : sectionKey)
  }

  const handleDone = () => {
    // Close all accordions
    setActivePaceSection(null)
    setIsOpen(false)

    // Scroll to the result card (total time)
    setTimeout(() => {
      const resultCard = document.querySelector('[data-result-card]')
      if (resultCard) {
        resultCard.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      } else {
        // Fallback: scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 100) // Small delay to allow accordion to close
  }

  const handleGPXSuccess = () => {
    // For GPX uploads, scroll to show the Pacing Strategy section
    // Close all accordions first
    setActivePaceSection(null)
    setIsOpen(false)

    setTimeout(() => {
      // Try to find the Pacing Strategy section
      const pacingSection = document.querySelector(
        'h3:has-text("Pacing Strategy"), [data-pacing-strategy]'
      )
      if (pacingSection) {
        pacingSection.scrollIntoView({
          behavior: 'smooth',
          block: 'center', // Center the pacing strategy in viewport
        })
      } else {
        // Fallback: scroll to result card but with more margin for mobile
        const resultCard = document.querySelector('[data-result-card]')
        if (resultCard) {
          const isMobile = window.innerWidth <= 768
          resultCard.scrollIntoView({
            behavior: 'smooth',
            block: isMobile ? 'end' : 'start', // On mobile, show more content above
          })
        }
      }
    }, 150) // Slightly longer delay for race selection
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
        <>
          <div style={styles.moreOptionsContent}>
            {/* Distance Presets */}
            <div style={styles.presetSection}>
              <h3 style={styles.presetHeader}>Common Distances</h3>
              <div style={styles.distancePresets}>
                {Object.entries(NYRR_DISTANCE_FACTORS).map(([key, data]) => (
                  <button
                    key={key}
                    style={{
                      ...styles.presetButton,
                      ...(isDistanceSelected(data.miles)
                        ? styles.presetButtonActive
                        : {}),
                    }}
                    onClick={() => handleDistancePreset(data.miles, 'mi')}
                  >
                    {data.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Pace Preset Sections */}
            <div style={styles.presetSection}>
              <h3 style={styles.presetHeader}>Pace Presets</h3>

              {/* Marathon Qualifying Times */}
              <div style={styles.collapsibleSection}>
                <button
                  style={styles.collapsibleToggle}
                  onClick={() => togglePaceSection('qualifying')}
                  aria-expanded={activePaceSection === 'qualifying'}
                >
                  Marathon Qualifying Times (2026){' '}
                  {activePaceSection === 'qualifying' ? '▲' : '▼'}
                </button>
                {activePaceSection === 'qualifying' && (
                  <div style={styles.collapsibleContent}>
                    <div style={styles.elevationDisclaimer}>
                      Based on official 2026 qualifying standards for major
                      marathons
                    </div>
                    <QualifyingTimesSection
                      onPacePreset={handlePacePreset}
                      formatPaceForDisplay={formatPaceForDisplay}
                      isPaceSelected={(paceSeconds) => {
                        if (!urlState.pace) return false
                        const urlPaceSeconds = parsePaceStringToSeconds(
                          urlState.pace
                        )
                        if (urlPaceSeconds === null) return false
                        return Math.abs(urlPaceSeconds - paceSeconds) <= 3
                      }}
                    />
                  </div>
                )}
              </div>

              {/* NYRR Corral Paces */}
              <div style={styles.collapsibleSection}>
                <button
                  style={styles.collapsibleToggle}
                  onClick={() => togglePaceSection('nyrr')}
                  aria-expanded={activePaceSection === 'nyrr'}
                >
                  NYRR Corral Paces
                  {isNYRRDistance && currentDistanceData
                    ? ` (for ${currentDistanceData.label})`
                    : ''}{' '}
                  {activePaceSection === 'nyrr' ? '▲' : '▼'}
                </button>
                {activePaceSection === 'nyrr' && (
                  <div style={styles.collapsibleContent}>
                    {!isNYRRDistance ? (
                      <div style={styles.errorMessage}>
                        Please select an NYRR race distance above to see corral
                        pace requirements.
                      </div>
                    ) : (
                      <>
                        <div style={styles.elevationDisclaimer}>
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
                        </div>

                        <div style={styles.pacePresetGrid}>
                          {NYRR_PACE_PRESETS.map((preset) => (
                            <button
                              key={preset.corral}
                              style={{
                                ...styles.presetButton,
                                ...(isPaceSelected(preset.pace10kSeconds)
                                  ? styles.presetButtonActive
                                  : {}),
                              }}
                              onClick={() =>
                                handlePacePreset(
                                  calculatePaceForDistance(
                                    preset.pace10kSeconds
                                  ),
                                  preset.corral
                                )
                              }
                            >
                              <div>
                                <div>
                                  {preset.corral}:{' '}
                                  {formatPaceForDisplay(
                                    calculatePaceForDistance(
                                      preset.pace10kSeconds
                                    )
                                  )}
                                </div>
                                <div style={styles.paceSource}>
                                  from{' '}
                                  {formatPaceForDisplay(preset.pace10kSeconds)}{' '}
                                  10K pace
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Pacing Strategy Toggle - only show if race profile is selected */}
            {raceProfile && (
              <div
                style={styles.presetSection}
                data-pacing-strategy
              >
                <h3 style={styles.presetHeader}>Pacing Strategy</h3>
                <div style={styles.pacingStrategyToggle}>
                  <button
                    style={{
                      ...styles.pacingStrategyButton,
                      ...(pacingStrategy === 'even-pace'
                        ? styles.pacingStrategyButtonActive
                        : {}),
                    }}
                    onClick={() => onPacingStrategyChange('even-pace')}
                  >
                    Even Pace
                    <div style={styles.pacingStrategyDescription}>
                      Maintain constant pace, effort varies with terrain
                    </div>
                  </button>
                  <button
                    style={{
                      ...styles.pacingStrategyButton,
                      ...(pacingStrategy === 'even-effort'
                        ? styles.pacingStrategyButtonActive
                        : {}),
                    }}
                    onClick={() => onPacingStrategyChange('even-effort')}
                  >
                    Even Effort
                    <div style={styles.pacingStrategyDescription}>
                      Maintain constant effort, pace varies with terrain
                    </div>
                  </button>
                </div>

                {pacingStrategy === 'even-effort' && (
                  <div style={styles.gapNote}>
                    <strong>About Grade Adjusted Pace:</strong> Our calculations
                    are based on metabolic cost research showing ~3% pace
                    adjustment per 1% uphill grade and ~2% per 1% downhill
                    grade. This approach helps maintain consistent physiological
                    effort across elevation changes. Learn more about{' '}
                    <a
                      href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6024138/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.link}
                    >
                      running energetics research
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://medium.com/strava-engineering/an-improved-gap-model-8b07ae8886c3"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.link}
                    >
                      Strava's GAP approach
                    </a>
                    .
                  </div>
                )}
              </div>
            )}

            {/* Race Presets */}
            <RacePresetsSection
              onRacePreset={onRacePreset}
              isRaceSelected={isRaceSelected}
              onGPXSuccess={handleGPXSuccess}
            />

            {/* Sticky Done Button */}
            <div style={styles.stickyButtonContainer}>
              <button
                style={styles.doneButton}
                onClick={handleDone}
              >
                Done
              </button>
            </div>
          </div>
        </>
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

// Helper function to parse pace string to seconds
const parsePaceStringToSeconds = (paceStr: string): number | null => {
  const trimmed = paceStr.trim()
  if (!trimmed) return null

  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed)
    if (num < 100) return num * 60
    if (num < 10000) {
      const minutes = Math.floor(num / 100)
      const seconds = num % 100
      return minutes * 60 + seconds
    }
  }

  const parts = trimmed.split(':').map((p) => p.trim())
  if (parts.length === 2) {
    const minutes = parseInt(parts[0])
    const seconds = parseInt(parts[1])
    if (!isNaN(minutes) && !isNaN(seconds) && seconds < 60) {
      return minutes * 60 + seconds
    }
  }

  return null
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
  { corral: 'AA Men', pace10kSeconds: 5 * 60 + 4 },
  { corral: 'AA Women', pace10kSeconds: 6 * 60 + 19 },
  { corral: 'AA Non-Binary', pace10kSeconds: 6 * 60 + 19 },
  { corral: 'A', pace10kSeconds: 6 * 60 + 29 },
  { corral: 'B', pace10kSeconds: 7 * 60 + 12 },
  { corral: 'C', pace10kSeconds: 7 * 60 + 42 },
  { corral: 'D', pace10kSeconds: 8 * 60 + 4 },
  { corral: 'E', pace10kSeconds: 8 * 60 + 29 },
  { corral: 'F', pace10kSeconds: 8 * 60 + 54 },
  { corral: 'G', pace10kSeconds: 9 * 60 + 17 },
  { corral: 'H', pace10kSeconds: 9 * 60 + 47 },
  { corral: 'I', pace10kSeconds: 10 * 60 + 16 },
  { corral: 'J', pace10kSeconds: 11 * 60 + 2 },
  { corral: 'K', pace10kSeconds: 12 * 60 + 16 },
  { corral: 'L', pace10kSeconds: 25 * 60 + 0 },
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
  link: {
    color: 'var(--text-primary)',
    textDecoration: 'underline',
  },
  pacePresetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))',
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
  gapNote: {
    marginTop: 12,
    padding: '12px 16px',
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    borderRadius: 8,
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    border: '1px solid rgba(102, 126, 234, 0.2)',
  },
  collapsibleSection: {
    marginBottom: 12,
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  collapsibleToggle: {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
  },
  collapsibleContent: {
    padding: '16px',
    backgroundColor: 'var(--bg-card-alt)',
    borderTop: '1px solid var(--border-color)',
  },
  pacingStrategyToggle: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  pacingStrategyButton: {
    padding: '12px 16px',
    border: '1px solid var(--border-color)',
    borderColor: 'var(--border-color)',
    borderRadius: 8,
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    fontSize: '0.9rem',
  },
  pacingStrategyButtonActive: {
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
    borderColor: 'rgba(231, 76, 60, 0.3)',
    boxShadow: '0 2px 8px rgba(231, 76, 60, 0.1)',
    color: 'var(--text-primary)',
    fontWeight: 'normal',
  },
  pacingStrategyDescription: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: 4,
    fontWeight: 'normal',
  },
  stickyButtonContainer: {
    position: 'sticky',
    bottom: 16,
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 16,
    zIndex: 100,
  },
  doneButton: {
    padding: '16px 32px',
    backdropFilter: 'blur(10px)',
    backgroundColor: 'transparent',
    borderColor: 'var(--border-color)',
    borderWidth: 1,
    borderStyle: 'solid',
    color: 'white',
    borderRadius: 10,
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as React.CSSProperties,
}
