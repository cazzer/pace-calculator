import React from 'react'
import { Unit } from './types'
import { Splits } from './Splits'
import { PresetOptions } from './PresetOptions'
import { CalculationModeToggle } from './components/CalculationModeToggle'
import { InputSection } from './components/InputSection'
import { ResultCard } from './components/ResultCard'
import { parsePaceToSeconds, formatHMS, convertDistanceTo } from './utils'
import { RaceProfile, RACE_PROFILES } from './elevation'
import { useLocation } from 'wouter'
import { parseUrlParams, serializeUrlParams, AppState } from './hashRouter'

export default function App() {
  // Parse URL state immediately for initial values
  const initialUrlState = parseUrlParams(window.location.search.slice(1))

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
  const [calcMode, setCalcMode] = React.useState<'time' | 'pace'>(
    initialUrlState.mode || 'time'
  )

  // Pace (string to allow "mm:ss")
  const [paceStr, setPaceStr] = React.useState<string>(
    initialUrlState.pace || '7:30'
  )
  const [paceUnit, setPaceUnit] = React.useState<Unit>(
    initialUrlState.paceUnit || 'mi'
  )

  // Goal time (for pace calculation mode)
  const [goalTimeStr, setGoalTimeStr] = React.useState<string>(
    initialUrlState.goalTime || '3:15:00'
  )

  // Distance (numeric string input)
  const [distanceStr, setDistanceStr] = React.useState<string>(
    initialUrlState.distance?.toString() || '26.2'
  )
  const [distanceUnit, setDistanceUnit] = React.useState<Unit>(
    initialUrlState.distanceUnit || 'mi'
  )

  // Race profile state
  const [raceProfile, setRaceProfile] = React.useState<RaceProfile | null>(
    initialUrlState.race && RACE_PROFILES[initialUrlState.race]
      ? RACE_PROFILES[initialUrlState.race]
      : null
  )

  // Pacing strategy state
  const [pacingStrategy, setPacingStrategy] = React.useState<
    'even-pace' | 'even-effort'
  >(initialUrlState.pacingStrategy || 'even-pace')

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
    if (calcMode === 'time') {
      // Time calculation mode: set the pace
      const minutes = Math.floor(paceSeconds / 60)
      const seconds = Math.round(paceSeconds % 60)
      const paceString = `${minutes}:${seconds.toString().padStart(2, '0')}`
      setPaceStr(paceString)
    } else {
      // Pace calculation mode: calculate goal time from pace
      const distanceInPaceUnits =
        paceUnit === distanceUnit
          ? distanceVal
          : convertDistanceTo(paceUnit, distanceVal, distanceUnit)

      if (Number.isFinite(distanceInPaceUnits) && distanceInPaceUnits > 0) {
        const totalTimeSeconds = paceSeconds * distanceInPaceUnits
        const goalTimeString = formatHMS(totalTimeSeconds)
        setGoalTimeStr(goalTimeString)
      }
    }
    // Don't change calculation mode - respect user's current choice
  }

  const handleDistancePreset = (distance: number, unit: Unit) => {
    setDistanceStr(distance.toString())
    setDistanceUnit(unit)
  }

  const handleRacePreset = (race: RaceProfile) => {
    setDistanceStr(race.distance.toString())
    setDistanceUnit(race.unit)
    setRaceProfile(race)
    // URL will be updated automatically via useEffect
  }

  const handleClearRace = () => {
    setRaceProfile(null)
  }

  // URL state management
  const [location, setLocation] = useLocation()

  const updateUrlState = React.useCallback((newState: AppState) => {
    const search = serializeUrlParams(newState)
    const newUrl = search
      ? `${window.location.pathname}?${search}`
      : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [])

  // Update URL when state changes
  React.useEffect(() => {
    const currentState: AppState = {
      distance: Number.isFinite(distanceVal) ? distanceVal : undefined,
      distanceUnit: distanceUnit,
      pace: paceStr || undefined,
      paceUnit: paceUnit,
      goalTime: goalTimeStr || undefined,
      mode: calcMode,
      race: raceProfile
        ? Object.keys(RACE_PROFILES).find(
            (key) => RACE_PROFILES[key] === raceProfile
          )
        : undefined,
      pacingStrategy: pacingStrategy,
    }

    updateUrlState(currentState)
  }, [
    distanceVal,
    distanceUnit,
    paceStr,
    paceUnit,
    goalTimeStr,
    calcMode,
    raceProfile,
    pacingStrategy,
    updateUrlState,
  ])

  // Listen for popstate events (back/forward navigation)
  React.useEffect(() => {
    const handlePopState = () => {
      const currentUrlState = parseUrlParams(window.location.search.slice(1))

      if (currentUrlState.distance !== undefined) {
        setDistanceStr(currentUrlState.distance.toString())
      }
      if (currentUrlState.distanceUnit) {
        setDistanceUnit(currentUrlState.distanceUnit)
      }
      if (currentUrlState.pace) {
        setPaceStr(currentUrlState.pace)
      }
      if (currentUrlState.paceUnit) {
        setPaceUnit(currentUrlState.paceUnit)
      }
      if (currentUrlState.goalTime) {
        setGoalTimeStr(currentUrlState.goalTime)
      }
      if (currentUrlState.mode) {
        setCalcMode(currentUrlState.mode)
      }
      if (currentUrlState.race && RACE_PROFILES[currentUrlState.race]) {
        setRaceProfile(RACE_PROFILES[currentUrlState.race])
      } else if (!currentUrlState.race) {
        setRaceProfile(null)
      }
      if (currentUrlState.pacingStrategy) {
        setPacingStrategy(currentUrlState.pacingStrategy)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <div
      style={{
        ...styles.appWrapper,
        ...(isDarkMode ? styles.darkTheme : styles.lightTheme),
      }}
      className="pace-calculator-app"
    >
      <style>{`
        @media (max-width: 768px) {
          .desktop-label { display: none !important; }
          .mobile-label { display: inline !important; }
          .pace-calculator-app {
            padding: 0.5rem 0.25rem !important;
          }
          .pace-calculator-app > div {
            padding: 0 4px !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-label { display: inline !important; }
          .mobile-label { display: none !important; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={styles.page}>
        <div>
          <h1 style={styles.h1}>Pace Calculator</h1>

          <CalculationModeToggle
            calcMode={calcMode}
            onChange={setCalcMode}
          />

          <InputSection
            calcMode={calcMode}
            distanceStr={distanceStr}
            distanceUnit={distanceUnit}
            distanceError={distanceError}
            onDistanceChange={setDistanceStr}
            onDistanceUnitChange={setDistanceUnit}
            paceStr={paceStr}
            paceUnit={paceUnit}
            paceError={paceError}
            onPaceChange={handlePaceInput}
            onPaceUnitChange={setPaceUnit}
            goalTimeStr={goalTimeStr}
            goalTimeError={goalTimeError}
            onGoalTimeChange={handleGoalTimeInput}
          />

          <ResultCard
            calcMode={calcMode}
            totalSeconds={totalSeconds}
            targetPaceSec={targetPaceSec}
            paceError={paceError}
            goalTimeError={goalTimeError}
            distanceError={distanceError}
            distanceVal={distanceVal}
            distanceUnit={distanceUnit}
            paceStr={paceStr}
            goalTimeStr={goalTimeStr}
            paceUnit={paceUnit}
          />
        </div>

        {/* Preset Options Section */}
        <PresetOptions
          onPacePreset={handlePacePreset}
          onDistancePreset={handleDistancePreset}
          onRacePreset={handleRacePreset}
          onClearRace={handleClearRace}
          currentDistance={Number.isFinite(distanceVal) ? distanceVal : NaN}
          currentDistanceUnit={distanceUnit}
          paceUnit={paceUnit}
          currentPaceSeconds={paceSec}
          raceProfile={raceProfile}
          pacingStrategy={pacingStrategy}
          onPacingStrategyChange={setPacingStrategy}
        />

        <Splits
          paceSecondsPerUnit={calcMode === 'time' ? paceSec : targetPaceSec}
          paceUnit={paceUnit}
          totalDistance={Number.isFinite(distanceVal) ? distanceVal : 0}
          distanceUnit={distanceUnit}
          showSegmentTimes={false}
          raceProfile={raceProfile}
          pacingStrategy={pacingStrategy}
        />

        {/* Footer with GitHub link */}
        <div style={styles.footer}>
          <a
            href="https://github.com/cazzer/pace-calculator/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.footerLink}
          >
            Report an issue or request a feature →
          </a>
        </div>
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
    marginTop: 4, // Reduced since observer target has margin now
    padding: 16,
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    background: 'var(--bg-card)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
  },

  observerTarget: {
    height: '1px',
    width: '100%',
    pointerEvents: 'none',
    visibility: 'hidden',
    marginTop: 16,
  },

  stickyContent: {
    maxWidth: 820,
    margin: '0 auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },

  stickyResultCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  resultValue: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    transition: 'font-size 0.3s ease',
  },

  resultLabel: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginTop: 4,
    fontWeight: 500,
    transition: 'all 0.3s ease',
  },

  stickyFields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    width: '100%',
    maxWidth: 400,
    opacity: 0.7,
    animation: 'fadeInUp 0.4s ease-out 0.1s both',
  },

  stickyField: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },

  stickyFieldValue: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },

  stickyFieldLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },

  error: {
    marginTop: 8,
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    color: '#dc2626',
    fontSize: '0.85rem',
  },

  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: '1px solid var(--border-color)',
    textAlign: 'center',
  },

  footerLink: {
    color: 'var(--text-tertiary)',
    textDecoration: 'none',
    fontSize: '0.85rem',
    transition: 'color 0.2s ease',
  },
}
