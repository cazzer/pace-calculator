import React from 'react'
import { UnitToggleProps } from '../types'

// ---- UI Component ----
export function UnitToggle(props: UnitToggleProps) {
  const { value, onChange, idBase } = props
  return (
    <div
      style={styles.toggleGroup}
      role="group"
      aria-label="Unit toggle"
    >
      <input
        id={idBase + '-mi'}
        type="radio"
        name={idBase + '-unit'}
        checked={value === 'mi'}
        onChange={() => onChange('mi')}
      />
      <label
        htmlFor={idBase + '-mi'}
        style={styles.toggleLabel}
      >
        mi
      </label>

      <input
        id={idBase + '-km'}
        type="radio"
        name={idBase + '-unit'}
        checked={value === 'km'}
        onChange={() => onChange('km')}
      />
      <label
        htmlFor={idBase + '-km'}
        style={styles.toggleLabel}
      >
        km
      </label>
    </div>
  )
}

// ---- Styles ----
const styles: Record<string, React.CSSProperties> = {
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
}
