import React from 'react'
import {
  RACE_PROFILES,
  RaceProfile,
  generateElevationSparkline,
} from '../elevation'

interface RacePresetsSectionProps {
  onRacePreset: (raceProfile: RaceProfile) => void
  isRaceSelected: (raceKey: string) => boolean
}

export function RacePresetsSection({
  onRacePreset,
  isRaceSelected,
}: RacePresetsSectionProps) {
  return (
    <div style={styles.presetSection}>
      <h3 style={styles.presetHeader}>Race Presets</h3>
      <div style={styles.elevationDisclaimer}>
        Note: Elevation data represents our best estimates and may not be
        perfectly accurate
      </div>
      <div style={styles.racePresets}>
        {Object.entries(RACE_PROFILES).map(([key, race]) => {
          const isSelected = isRaceSelected(key)
          const sparklineSvg = generateElevationSparkline(
            race.elevationProfile,
            100,
            30
          )

          return (
            <button
              key={key}
              style={{
                ...styles.racePresetButton,
                ...(isSelected ? styles.racePresetButtonActive : {}),
              }}
              onClick={() => onRacePreset(race)}
            >
              <div style={styles.racePresetLayout}>
                <div style={styles.racePresetLeft}>
                  {race.logoUrl && (
                    <img
                      src={race.logoUrl}
                      alt={race.name}
                      style={styles.raceLogo}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallback = document.createElement('div')
                        fallback.textContent = race.name
                        fallback.style.cssText = `
                          font-weight: 600;
                          font-size: 1.1rem;
                          color: var(--text-primary);
                        `
                        e.currentTarget.parentNode?.insertBefore(
                          fallback,
                          e.currentTarget.nextSibling
                        )
                      }}
                    />
                  )}
                </div>
                <div style={styles.raceSparklineContainer}>
                  <div
                    style={{
                      ...styles.raceSparkline,
                      color: isSelected
                        ? 'rgba(231, 76, 60, 0.8)'
                        : 'var(--text-tertiary)',
                    }}
                    dangerouslySetInnerHTML={{ __html: sparklineSvg }}
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  presetSection: {
    marginBottom: 24,
  },
  presetHeader: {
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: 'var(--text-primary)',
  },
  elevationDisclaimer: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  racePresets: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 12,
  },
  racePresetButton: {
    padding: '16px 20px',
    border: '2px solid var(--border-color)',
    borderColor: 'var(--border-color)',
    borderRadius: 12,
    backgroundColor: 'var(--bg-card-alt)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s ease',
    background:
      'linear-gradient(135deg, var(--bg-card-alt) 0%, var(--bg-card) 100%)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  racePresetButtonActive: {
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
    borderColor: 'rgba(231, 76, 60, 0.3)',
    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.15)',
    color: 'var(--text-primary)',
    transform: 'translateY(-1px)',
  },
  racePresetLayout: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  racePresetLeft: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  raceLogo: {
    height: '60px',
    width: 'auto',
    maxWidth: '70%',
    objectFit: 'contain',
    flexShrink: 0,
  },
  raceSparklineContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    position: 'relative',
    zIndex: 2,
  },
  raceSparkline: {
    opacity: 0.8,
    transition: 'all 0.2s ease',
    minWidth: 100,
    maxWidth: 140,
    flex: '0 1 auto',
  },
  elevationLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
}
