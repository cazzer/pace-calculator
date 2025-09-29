import React from 'react'
import { formatHMS } from '../utils/common'

interface QualifyingTimesSectionProps {
  onPacePreset: (paceSeconds: number, category: string) => void
  formatPaceForDisplay: (paceInSeconds: number) => string
  isPaceSelected: (paceSeconds: number) => boolean
}

export function QualifyingTimesSection({
  onPacePreset,
  formatPaceForDisplay,
  isPaceSelected,
}: QualifyingTimesSectionProps) {
  return (
    <div style={styles.presetSection}>
      <h3 style={styles.presetHeader}>Marathon Qualifying Times</h3>
      <div style={styles.elevationDisclaimer}>
        Based on official qualifying standards for major marathons
      </div>

      <div style={styles.qualifyingSection}>
        <h4 style={styles.qualifyingSubHeader}>
          Boston Marathon (2026 Standards)
        </h4>
        <div style={styles.pacePresetGrid}>
          {BOSTON_QUALIFYING_TIMES.map((preset) => (
            <button
              key={preset.category}
              style={{
                ...styles.presetButton,
                ...(isPaceSelected(preset.paceSeconds)
                  ? styles.presetButtonActive
                  : {}),
              }}
              onClick={() => onPacePreset(preset.paceSeconds, preset.category)}
            >
              <div>
                <div>
                  {preset.category}: {formatPaceForDisplay(preset.paceSeconds)}
                </div>
                <div style={styles.paceSource}>
                  {formatHMS(preset.marathonTimeSeconds)} marathon
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.qualifyingSection}>
        <h4 style={styles.qualifyingSubHeader}>
          NYC Marathon (Guaranteed Entry Times)
        </h4>
        <div style={styles.pacePresetGrid}>
          {NYC_QUALIFYING_TIMES.map((preset) => (
            <button
              key={preset.category}
              style={{
                ...styles.presetButton,
                ...(isPaceSelected(preset.paceSeconds)
                  ? styles.presetButtonActive
                  : {}),
              }}
              onClick={() => onPacePreset(preset.paceSeconds, preset.category)}
            >
              <div>
                <div>
                  {preset.category}: {formatPaceForDisplay(preset.paceSeconds)}
                </div>
                <div style={styles.paceSource}>
                  {formatHMS(preset.marathonTimeSeconds)} marathon
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Boston Marathon qualifying times (2026 standards)
const BOSTON_QUALIFYING_TIMES = [
  {
    category: 'Men 18-34',
    marathonTimeSeconds: 2 * 3600 + 55 * 60 + 0,
    paceSeconds: 6 * 60 + 41,
  }, // 2:55:00, 6:41/mi
  {
    category: 'Men 35-39',
    marathonTimeSeconds: 3 * 3600 + 0 * 60 + 0,
    paceSeconds: 6 * 60 + 52,
  }, // 3:00:00, 6:52/mi
  {
    category: 'Men 40-44',
    marathonTimeSeconds: 3 * 3600 + 5 * 60 + 0,
    paceSeconds: 7 * 60 + 3,
  }, // 3:05:00, 7:03/mi
  {
    category: 'Men 45-49',
    marathonTimeSeconds: 3 * 3600 + 15 * 60 + 0,
    paceSeconds: 7 * 60 + 26,
  }, // 3:15:00, 7:26/mi
  {
    category: 'Men 50-54',
    marathonTimeSeconds: 3 * 3600 + 20 * 60 + 0,
    paceSeconds: 7 * 60 + 38,
  }, // 3:20:00, 7:38/mi
  {
    category: 'Men 55-59',
    marathonTimeSeconds: 3 * 3600 + 30 * 60 + 0,
    paceSeconds: 8 * 60 + 0,
  }, // 3:30:00, 8:00/mi
  {
    category: 'Men 60-64',
    marathonTimeSeconds: 3 * 3600 + 50 * 60 + 0,
    paceSeconds: 8 * 60 + 46,
  }, // 3:50:00, 8:46/mi
  {
    category: 'Men 65-69',
    marathonTimeSeconds: 4 * 3600 + 5 * 60 + 0,
    paceSeconds: 9 * 60 + 20,
  }, // 4:05:00, 9:20/mi
  {
    category: 'Men 70-74',
    marathonTimeSeconds: 4 * 3600 + 20 * 60 + 0,
    paceSeconds: 9 * 60 + 54,
  }, // 4:20:00, 9:54/mi
  {
    category: 'Men 75-79',
    marathonTimeSeconds: 4 * 3600 + 35 * 60 + 0,
    paceSeconds: 10 * 60 + 29,
  }, // 4:35:00, 10:29/mi
  {
    category: 'Men 80+',
    marathonTimeSeconds: 4 * 3600 + 50 * 60 + 0,
    paceSeconds: 11 * 60 + 3,
  }, // 4:50:00, 11:03/mi
  {
    category: 'Women/X 18-34',
    marathonTimeSeconds: 3 * 3600 + 25 * 60 + 0,
    paceSeconds: 7 * 60 + 49,
  }, // 3:25:00, 7:49/mi
  {
    category: 'Women/X 35-39',
    marathonTimeSeconds: 3 * 3600 + 30 * 60 + 0,
    paceSeconds: 8 * 60 + 0,
  }, // 3:30:00, 8:00/mi
  {
    category: 'Women/X 40-44',
    marathonTimeSeconds: 3 * 3600 + 35 * 60 + 0,
    paceSeconds: 8 * 60 + 12,
  }, // 3:35:00, 8:12/mi
  {
    category: 'Women/X 45-49',
    marathonTimeSeconds: 3 * 3600 + 45 * 60 + 0,
    paceSeconds: 8 * 60 + 35,
  }, // 3:45:00, 8:35/mi
  {
    category: 'Women/X 50-54',
    marathonTimeSeconds: 3 * 3600 + 50 * 60 + 0,
    paceSeconds: 8 * 60 + 46,
  }, // 3:50:00, 8:46/mi
  {
    category: 'Women/X 55-59',
    marathonTimeSeconds: 4 * 3600 + 0 * 60 + 0,
    paceSeconds: 9 * 60 + 9,
  }, // 4:00:00, 9:09/mi
  {
    category: 'Women/X 60-64',
    marathonTimeSeconds: 4 * 3600 + 20 * 60 + 0,
    paceSeconds: 9 * 60 + 54,
  }, // 4:20:00, 9:54/mi
  {
    category: 'Women/X 65-69',
    marathonTimeSeconds: 4 * 3600 + 35 * 60 + 0,
    paceSeconds: 10 * 60 + 29,
  }, // 4:35:00, 10:29/mi
  {
    category: 'Women/X 70-74',
    marathonTimeSeconds: 4 * 3600 + 50 * 60 + 0,
    paceSeconds: 11 * 60 + 3,
  }, // 4:50:00, 11:03/mi
  {
    category: 'Women/X 75-79',
    marathonTimeSeconds: 5 * 3600 + 5 * 60 + 0,
    paceSeconds: 11 * 60 + 37,
  }, // 5:05:00, 11:37/mi
  {
    category: 'Women/X 80+',
    marathonTimeSeconds: 5 * 3600 + 20 * 60 + 0,
    paceSeconds: 12 * 60 + 12,
  }, // 5:20:00, 12:12/mi
]

// NYC Marathon guaranteed entry times (estimated based on recent years)
const NYC_QUALIFYING_TIMES = [
  {
    category: 'Men 18-34',
    marathonTimeSeconds: 2 * 3600 + 53 * 60 + 0,
    paceSeconds: 6 * 60 + 36,
  }, // 2:53:00, 6:36/mi
  {
    category: 'Men 35-39',
    marathonTimeSeconds: 2 * 3600 + 55 * 60 + 0,
    paceSeconds: 6 * 60 + 40,
  }, // 2:55:00, 6:40/mi
  {
    category: 'Men 40-44',
    marathonTimeSeconds: 2 * 3600 + 58 * 60 + 0,
    paceSeconds: 6 * 60 + 47,
  }, // 2:58:00, 6:47/mi
  {
    category: 'Men 45-49',
    marathonTimeSeconds: 3 * 3600 + 5 * 60 + 0,
    paceSeconds: 7 * 60 + 3,
  }, // 3:05:00, 7:03/mi
  {
    category: 'Men 50-54',
    marathonTimeSeconds: 3 * 3600 + 14 * 60 + 0,
    paceSeconds: 7 * 60 + 24,
  }, // 3:14:00, 7:24/mi
  {
    category: 'Men 55-59',
    marathonTimeSeconds: 3 * 3600 + 23 * 60 + 0,
    paceSeconds: 7 * 60 + 45,
  }, // 3:23:00, 7:45/mi
  {
    category: 'Men 60-64',
    marathonTimeSeconds: 3 * 3600 + 34 * 60 + 0,
    paceSeconds: 8 * 60 + 10,
  }, // 3:34:00, 8:10/mi
  {
    category: 'Men 65-69',
    marathonTimeSeconds: 3 * 3600 + 45 * 60 + 0,
    paceSeconds: 8 * 60 + 35,
  }, // 3:45:00, 8:35/mi
  {
    category: 'Men 70-74',
    marathonTimeSeconds: 4 * 3600 + 10 * 60 + 0,
    paceSeconds: 9 * 60 + 31,
  }, // 4:10:00, 9:31/mi
  {
    category: 'Men 75-79',
    marathonTimeSeconds: 4 * 3600 + 30 * 60 + 0,
    paceSeconds: 10 * 60 + 17,
  }, // 4:30:00, 10:17/mi
  {
    category: 'Men 80+',
    marathonTimeSeconds: 4 * 3600 + 55 * 60 + 0,
    paceSeconds: 11 * 60 + 14,
  }, // 4:55:00, 11:14/mi
  {
    category: 'Women 18-34',
    marathonTimeSeconds: 3 * 3600 + 13 * 60 + 0,
    paceSeconds: 7 * 60 + 22,
  }, // 3:13:00, 7:22/mi
  {
    category: 'Women 35-39',
    marathonTimeSeconds: 3 * 3600 + 15 * 60 + 0,
    paceSeconds: 7 * 60 + 26,
  }, // 3:15:00, 7:26/mi
  {
    category: 'Women 40-44',
    marathonTimeSeconds: 3 * 3600 + 26 * 60 + 0,
    paceSeconds: 7 * 60 + 51,
  }, // 3:26:00, 7:51/mi
  {
    category: 'Women 45-49',
    marathonTimeSeconds: 3 * 3600 + 38 * 60 + 0,
    paceSeconds: 8 * 60 + 19,
  }, // 3:38:00, 8:19/mi
  {
    category: 'Women 50-54',
    marathonTimeSeconds: 3 * 3600 + 51 * 60 + 0,
    paceSeconds: 8 * 60 + 49,
  }, // 3:51:00, 8:49/mi
  {
    category: 'Women 55-59',
    marathonTimeSeconds: 4 * 3600 + 10 * 60 + 0,
    paceSeconds: 9 * 60 + 31,
  }, // 4:10:00, 9:31/mi
  {
    category: 'Women 60-64',
    marathonTimeSeconds: 4 * 3600 + 27 * 60 + 0,
    paceSeconds: 10 * 60 + 10,
  }, // 4:27:00, 10:10/mi
  {
    category: 'Women 65-69',
    marathonTimeSeconds: 4 * 3600 + 50 * 60 + 0,
    paceSeconds: 11 * 60 + 3,
  }, // 4:50:00, 11:03/mi
  {
    category: 'Women 70-74',
    marathonTimeSeconds: 5 * 3600 + 30 * 60 + 0,
    paceSeconds: 12 * 60 + 33,
  }, // 5:30:00, 12:33/mi
  {
    category: 'Women 75-79',
    marathonTimeSeconds: 6 * 3600 + 0 * 60 + 0,
    paceSeconds: 13 * 60 + 44,
  }, // 6:00:00, 13:44/mi
  {
    category: 'Women 80+',
    marathonTimeSeconds: 6 * 3600 + 35 * 60 + 0,
    paceSeconds: 15 * 60 + 2,
  }, // 6:35:00, 15:02/mi
]

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
  qualifyingSection: {
    marginBottom: 20,
  },
  qualifyingSubHeader: {
    fontSize: '0.95rem',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: 'var(--text-secondary)',
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
  paceSource: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginTop: 2,
  },
}
