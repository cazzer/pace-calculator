import React from 'react'

interface CalculationModeToggleProps {
  calcMode: 'time' | 'pace'
  onChange: (mode: 'time' | 'pace') => void
}

export function CalculationModeToggle({
  calcMode,
  onChange,
}: CalculationModeToggleProps) {
  return (
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
          onClick={() => onChange('time')}
        >
          Calculate Time from Pace
        </button>
        <button
          style={{
            ...styles.modeButton,
            ...(calcMode === 'pace' ? styles.modeButtonActive : {}),
          }}
          className="mode-button-mobile"
          onClick={() => onChange('pace')}
        >
          Calculate Pace from Time
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
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
}
