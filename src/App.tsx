import React from 'react'
import { Unit } from './types'
import { Splits } from './Splits'
import { UnitToggle } from './UnitToggle'
import { PresetOptions } from './PresetOptions'
import { parsePaceToSeconds, formatHMS, convertDistanceTo } from './utils'

export default function App() {
  // Detect system theme preference
  const [isDarkMode, setIsDarkMode] = React.useState(
    () =>
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Calculation mode
  const [calcMode, setCalcMode] = React.useState<'time' | 'pace'>('time')

  // Pace (string to allow "mm:ss")
  const [paceStr, setPaceStr] = React.useState<string>('7:30')
  const [paceUnit, setPaceUnit] = React.useState<Unit>('mi')

  // Goal time (for pace calculation mode)
  const [goalTimeStr, setGoalTimeStr] = React.useState<string>('3:15:00')

  // Distance (numeric string input)
  const [distanceStr, setDistanceStr] = React.useState<string>('26.2')
  const [distanceUnit, setDistanceUnit] = React.useState<Unit>('mi')

  // Format pace input as user types
  const handlePaceInput = (value: string) => {
    // Remove all non-digits first
    const digitsOnly = value.replace(/\D/g, '')

    if (digitsOnly.length === 0) {
      setPaceStr('')
      return
    }

    // Format based on length
    if (digitsOnly.length <= 2) {
      // 1-2 digits: just minutes (e.g., "7" or "12")
      setPaceStr(digitsOnly)
    } else if (digitsOnly.length === 3) {
      // 3 digits: m:ss format (e.g., "730" -> "7:30")
      setPaceStr(`${digitsOnly[0]}:${digitsOnly.slice(1)}`)
    } else if (digitsOnly.length === 4) {
      // 4 digits: mm:ss format (e.g., "1030" -> "10:30")
      setPaceStr(`${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2)}`)
    } else {
      // 5+ digits: treat as h:mm:ss or just cap at 4 digits
      if (digitsOnly.length >= 5) {
        const capped = digitsOnly.slice(0, 4)
        setPaceStr(`${capped.slice(0, 2)}:${capped.slice(2)}`)
      }
    }
  }

  // Format goal time input as user types
  const handleGoalTimeInput = (value: string) => {
    // Remove all non-digits first
    const digitsOnly = value.replace(/\D/g, '')

    if (digitsOnly.length === 0) {
      setGoalTimeStr('')
      return
    }

    // Format based on length
    if (digitsOnly.length <= 2) {
      // 1-2 digits: just minutes
      setGoalTimeStr(digitsOnly)
    } else if (digitsOnly.length === 3) {
      // 3 digits: m:ss format
      setGoalTimeStr(`${digitsOnly[0]}:${digitsOnly.slice(1)}`)
    } else if (digitsOnly.length === 4) {
      // 4 digits: mm:ss format
      setGoalTimeStr(`${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2)}`)
    } else if (digitsOnly.length === 5) {
      // 5 digits: h:mm:ss format
      setGoalTimeStr(
        `${digitsOnly[0]}:${digitsOnly.slice(1, 3)}:${digitsOnly.slice(3)}`
      )
    } else if (digitsOnly.length >= 6) {
      // 6+ digits: hh:mm:ss format (cap at 6)
      const capped = digitsOnly.slice(0, 6)
      setGoalTimeStr(
        `${capped.slice(0, 2)}:${capped.slice(2, 4)}:${capped.slice(4)}`
      )
    }
  }

  const paceSec = React.useMemo(() => parsePaceToSeconds(paceStr), [paceStr])
  const goalTimeSec = React.useMemo(
    () => parsePaceToSeconds(goalTimeStr),
    [goalTimeStr]
  )

  const distanceVal = React.useMemo(() => {
    const v = parseFloat(distanceStr)
    return Number.isFinite(v) && v >= 0 ? v : NaN
  }, [distanceStr])

  // Compute total time in seconds (for time calculation mode)
  const totalSeconds = React.useMemo(() => {
    if (calcMode !== 'time' || paceSec == null || !Number.isFinite(distanceVal))
      return null

    // Convert distance into the same unit as pace
    const distanceInPaceUnits =
      paceUnit === distanceUnit
        ? distanceVal
        : convertDistanceTo(paceUnit, distanceVal, distanceUnit)

    if (!Number.isFinite(distanceInPaceUnits)) return null

    return Math.max(0, distanceInPaceUnits * paceSec)
  }, [calcMode, paceSec, distanceVal, paceUnit, distanceUnit])

  // Compute target pace in seconds (for pace calculation mode)
  const targetPaceSec = React.useMemo(() => {
    if (
      calcMode !== 'pace' ||
      goalTimeSec == null ||
      !Number.isFinite(distanceVal)
    )
      return null

    // Convert distance into pace units for calculation
    const distanceInPaceUnits =
      paceUnit === distanceUnit
        ? distanceVal
        : convertDistanceTo(paceUnit, distanceVal, distanceUnit)

    if (!Number.isFinite(distanceInPaceUnits) || distanceInPaceUnits <= 0)
      return null

    return goalTimeSec / distanceInPaceUnits
  }, [calcMode, goalTimeSec, distanceVal, paceUnit, distanceUnit])

  const paceError = paceStr.trim().length > 0 && paceSec == null
  const goalTimeError = goalTimeStr.trim().length > 0 && goalTimeSec == null
  const distanceError =
    distanceStr.trim().length > 0 && !Number.isFinite(distanceVal)

  // Preset handlers
  const handlePacePreset = (paceSeconds: number) => {
    // The pace is already converted to the user's preferred unit, just format it as mm:ss
    const minutes = Math.floor(paceSeconds / 60)
    const seconds = Math.round(paceSeconds % 60)
    const paceString = `${minutes}:${seconds.toString().padStart(2, '0')}`

    setPaceStr(paceString)
    setCalcMode('time') // Switch to time calculation mode
  }

  const handleDistancePreset = (distance: number, unit: Unit) => {
    setDistanceStr(distance.toString())
    setDistanceUnit(unit)
  }

  // Sticky header state - DISABLED FOR NOW
  const [isCompact, setIsCompact] = React.useState(false)
  const headerRef = React.useRef<HTMLDivElement>(null)
  const observerTargetRef = React.useRef<HTMLDivElement>(null)

  // Set up intersection observer for sticky header - DISABLED
  React.useEffect(() => {
    // Commenting out observer to disable sticky functionality
    /*
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCompact(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    if (observerTargetRef.current) {
      observer.observe(observerTargetRef.current)
    }

    return () => observer.disconnect()
    */
  }, [])

  return (
    <div
      style={{
        ...styles.appWrapper,
        ...(isDarkMode ? styles.darkTheme : styles.lightTheme),
      }}
      className="pace-calculator-app"
    >
      <div style={styles.page}>
        {/* Observer target - DISABLED */}
        {/*
        <div
          ref={observerTargetRef}
          style={styles.observerTarget}
        />
        */}

        {/* Header Container - back to normal mode */}
        <div ref={headerRef}>
          <h1 style={styles.h1}>Race Time Calculator</h1>

          {/* Calculation Mode Toggle */}
          <div style={styles.field}>
            <div
              style={styles.modeToggle}
              className="mode-toggle-mobile"
            >
              <button
                style={{
                  ...styles.modeButton,
                  ...(calcMode === 'time' ? styles.modeButtonActive : {}),
                }}
                className="mode-button-mobile"
                onClick={() => setCalcMode('time')}
              >
                Calculate Time from Pace
              </button>
              <button
                style={{
                  ...styles.modeButton,
                  ...(calcMode === 'pace' ? styles.modeButtonActive : {}),
                }}
                className="mode-button-mobile"
                onClick={() => setCalcMode('pace')}
              >
                Calculate Pace from Time
              </button>
            </div>
          </div>

          <div
            style={styles.row}
            className="row-mobile"
          >
            {/* Distance */}
            <div style={styles.field}>
              <label
                style={styles.label}
                htmlFor="distance-input"
              >
                Distance
              </label>
              <div style={styles.inline}>
                <input
                  id="distance-input"
                  inputMode="decimal"
                  placeholder="e.g., 5"
                  value={distanceStr}
                  onChange={(e) => setDistanceStr(e.target.value)}
                  style={{
                    ...styles.input,
                    borderColor: distanceError ? '#c0392b' : '#ccc',
                  }}
                />
                <UnitToggle
                  value={distanceUnit}
                  onChange={setDistanceUnit}
                  idBase="distance"
                />
              </div>
              <div style={styles.help}>
                Examples: <code>5</code> (mi/km), <code>13.1</code>,{' '}
                <code>10</code>.
              </div>
            </div>

            {/* Pace or Goal Time Input */}
            {calcMode === 'time' ? (
              <div style={styles.field}>
                <label
                  style={styles.label}
                  htmlFor="pace-input"
                >
                  Pace ({paceUnit === 'mi' ? 'per mile' : 'per kilometer'})
                </label>
                <div style={styles.inline}>
                  <input
                    id="pace-input"
                    inputMode="numeric"
                    placeholder="730 → 7:30"
                    value={paceStr}
                    onChange={(e) => handlePaceInput(e.target.value)}
                    style={{
                      ...styles.input,
                      borderColor: paceError ? '#c0392b' : '#ccc',
                    }}
                  />
                  <UnitToggle
                    value={paceUnit}
                    onChange={setPaceUnit}
                    idBase="pace"
                  />
                </div>
                <div style={styles.help}>
                  Just type numbers: <code>730</code> → <code>7:30</code>
                </div>
              </div>
            ) : (
              <div style={styles.field}>
                <label
                  style={styles.label}
                  htmlFor="goal-time-input"
                >
                  Goal Time
                </label>
                <div style={styles.inline}>
                  <input
                    id="goal-time-input"
                    inputMode="numeric"
                    placeholder="31500 → 3:15:00"
                    value={goalTimeStr}
                    onChange={(e) => handleGoalTimeInput(e.target.value)}
                    style={{
                      ...styles.input,
                      borderColor: goalTimeError ? '#c0392b' : '#ccc',
                    }}
                  />
                </div>
                <div style={styles.help}>
                  Type numbers: <code>31500</code> → <code>3:15:00</code>,{' '}
                  <code>2530</code> → <code>25:30</code>
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          <div
            style={styles.resultCard}
            aria-live="polite"
          >
            <div style={styles.resultLabel}>
              {calcMode === 'time' ? 'Total Time' : 'Target Pace'}
            </div>
            <div style={styles.resultValue}>
              {calcMode === 'time'
                ? totalSeconds == null
                  ? '—'
                  : formatHMS(totalSeconds)
                : targetPaceSec == null
                ? '—'
                : formatHMS(targetPaceSec)}
            </div>
            {paceError && calcMode === 'time' && (
              <div style={styles.error}>Invalid pace. Try 7:30 or 7.5</div>
            )}
            {goalTimeError && calcMode === 'pace' && (
              <div style={styles.error}>
                Invalid goal time. Try 3:15:00 or 195
              </div>
            )}
            {distanceError && (
              <div style={styles.error}>
                Invalid distance. Use a non-negative number.
              </div>
            )}
          </div>
        </div>

        {/* Preset Options Section */}
        <PresetOptions
          onPacePreset={handlePacePreset}
          onDistancePreset={handleDistancePreset}
          currentDistance={Number.isFinite(distanceVal) ? distanceVal : NaN}
          currentDistanceUnit={distanceUnit}
          paceUnit={paceUnit}
          currentPaceSeconds={paceSec}
        />

        <Splits
          paceSecondsPerUnit={calcMode === 'time' ? paceSec : targetPaceSec}
          paceUnit={paceUnit}
          totalDistance={Number.isFinite(distanceVal) ? distanceVal : 0}
          distanceUnit={distanceUnit}
          showSegmentTimes={false}
        />
      </div>
    </div>
  )
}

// ---- Styles ----
const styles: Record<string, React.CSSProperties> = {
  appWrapper: {
    fontFamily:
      'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    lineHeight: 1.4,
    width: '100%',
    minHeight: '100vh',
    boxSizing: 'border-box',
    padding: '2rem',
    textAlign: 'center',
  },
  lightTheme: {
    '--text-primary': '#213547',
    '--text-secondary': '#666666',
    '--text-tertiary': '#666666',
    '--text-muted': '#777777',
    '--bg-card': '#fafafa',
    '--bg-card-alt': '#ffffff',
    '--bg-secondary': '#f0f0f0',
    '--border-color': '#e5e5e5',
    '--border-table': '#dddddd',
    '--button-bg': 'transparent',
    '--button-bg-active': '#ffffff',
    '--button-text': '#666666',
    '--button-text-active': '#213547',
    color: '#213547',
    backgroundColor: '#ffffff',
  } as React.CSSProperties,
  darkTheme: {
    '--text-primary': 'rgba(255, 255, 255, 0.95)',
    '--text-secondary': 'rgba(255, 255, 255, 0.7)',
    '--text-tertiary': 'rgba(255, 255, 255, 0.6)',
    '--text-muted': 'rgba(255, 255, 255, 0.5)',
    '--bg-card': 'rgba(255, 255, 255, 0.05)',
    '--bg-card-alt': 'rgba(255, 255, 255, 0.03)',
    '--bg-secondary': 'rgba(255, 255, 255, 0.08)',
    '--border-color': 'rgba(255, 255, 255, 0.1)',
    '--border-table': 'rgba(255, 255, 255, 0.2)',
    '--button-bg': 'transparent',
    '--button-bg-active': 'rgba(255, 255, 255, 0.15)',
    '--button-text': 'rgba(255, 255, 255, 0.8)',
    '--button-text-active': 'rgba(255, 255, 255, 0.95)',
    color: 'rgba(255, 255, 255, 0.87)',
    backgroundColor: '#242424',
  } as React.CSSProperties,
  page: {
    maxWidth: 820,
    margin: '0 auto',
    padding: '0 16px',
    width: '100%',
    boxSizing: 'border-box',
  },
  h1: {
    fontSize: '1.6rem',
    margin: '16px 0 16px',
    color: 'var(--text-primary)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    alignItems: 'start',
    width: '100%',
    minWidth: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontWeight: 600,
  },
  inline: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 8,
    alignItems: 'center',
    width: '100%',
    minWidth: 0,
  },
  input: {
    padding: '10px 12px',
    fontSize: '1rem',
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    outline: 'none',
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'var(--bg-card-alt)',
    color: 'var(--text-primary)',
  },
  toggleGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: 8,
  },
  toggleLabel: {
    marginRight: 8,
    userSelect: 'none',
  },
  help: {
    fontSize: '.85rem',
    color: 'var(--text-muted)',
  },
  resultCard: {
    marginTop: 20,
    padding: 16,
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    background: 'var(--bg-card)',
  },
  modeToggle: {
    display: 'flex',
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    boxSizing: 'border-box',
  },
  modeButton: {
    flex: 1,
    padding: '8px 16px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'var(--button-bg)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    color: 'var(--button-text)',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  modeButtonActive: {
    backgroundColor: 'var(--button-bg-active)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    color: 'var(--button-text-active)',
  },
  stickyHeader: {
    position: 'sticky',
    backdropFilter: 'blur(20px)',
    top: 0,
    backgroundColor: 'inherit',
    zIndex: 10,
    paddingBottom: '16px',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-color)',
  },
  observerTarget: {
    height: '1px',
    position: 'absolute',
    top: 10, // Move trigger point even further down
    width: '100%',
    pointerEvents: 'none',
    visibility: 'hidden', // Make it completely invisible
  },
  stickyHeaderContainer: {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 10,
  },
  stickyHeaderCompact: {
    position: 'sticky',
    top: '16px', // More space from top edge
    backgroundColor: 'inherit', // Use inherited background instead of fixed color
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '12px 16px',
    margin: '0 0 16px 0', // Remove negative margins
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },

  h1Compact: {
    fontSize: '1.2rem',
    margin: '0 0 8px 0',
  },
  modeToggleCompact: {
    marginBottom: '8px',
  },
  modeButtonCompact: {
    padding: '6px 12px',
    fontSize: '0.85rem',
  },
  inputCompact: {
    padding: '8px 10px',
    fontSize: '0.9rem',
  },
  resultCardCompact: {
    marginTop: '8px',
    padding: '8px 12px',
  },
  resultLabelCompact: {
    fontSize: '0.8rem',
  },
  resultValueCompact: {
    fontSize: '1.4rem',
    marginTop: '2px',
  },
}
