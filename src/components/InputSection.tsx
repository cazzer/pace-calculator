import React from 'react'
import { Unit } from '../types'
import { UnitToggle } from './UnitToggle'

interface InputSectionProps {
  calcMode: 'time' | 'pace'
  // Distance props
  distanceStr: string
  distanceUnit: Unit
  distanceError: boolean
  onDistanceChange: (value: string) => void
  onDistanceUnitChange: (unit: Unit) => void
  // Pace props
  paceStr: string
  paceUnit: Unit
  paceError: boolean
  onPaceChange: (value: string) => void
  onPaceUnitChange: (unit: Unit) => void
  // Goal time props
  goalTimeStr: string
  goalTimeError: boolean
  onGoalTimeChange: (value: string) => void
}

export function InputSection({
  calcMode,
  distanceStr,
  distanceUnit,
  distanceError,
  onDistanceChange,
  onDistanceUnitChange,
  paceStr,
  paceUnit,
  paceError,
  onPaceChange,
  onPaceUnitChange,
  goalTimeStr,
  goalTimeError,
  onGoalTimeChange,
}: InputSectionProps) {
  return (
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
            onChange={(e) => onDistanceChange(e.target.value)}
            style={{
              ...styles.input,
              borderColor: distanceError ? '#c0392b' : '#ccc',
            }}
          />
          <UnitToggle
            value={distanceUnit}
            onChange={onDistanceUnitChange}
            idBase="distance"
          />
        </div>
        <div style={styles.help}>
          Examples: <code>5</code> (mi/km), <code>13.1</code>, <code>10</code>.
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
              onChange={(e) => onPaceChange(e.target.value)}
              style={{
                ...styles.input,
                borderColor: paceError ? '#c0392b' : '#ccc',
              }}
            />
            <UnitToggle
              value={paceUnit}
              onChange={onPaceUnitChange}
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
              onChange={(e) => onGoalTimeChange(e.target.value)}
              style={{
                ...styles.input,
                borderColor: goalTimeError ? '#c0392b' : '#ccc',
              }}
            />
            <UnitToggle
              value={paceUnit}
              onChange={onPaceUnitChange}
              idBase="pace"
            />
          </div>
          <div style={styles.help}>
            Type numbers: <code>31500</code> → <code>3:15:00</code>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
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

  help: {
    fontSize: '.85rem',
    color: 'var(--text-muted)',
  },
}
