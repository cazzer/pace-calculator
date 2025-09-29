import React from 'react'
import { Unit } from '../types'
import { formatHMS } from '../utils'

interface ResultCardProps {
  calcMode: 'time' | 'pace'
  totalSeconds: number | null
  targetPaceSec: number | null
  paceError: boolean
  goalTimeError: boolean
  distanceError: boolean
  // For sticky fields
  distanceVal: number
  distanceUnit: Unit
  paceStr: string
  goalTimeStr: string
  paceUnit: Unit
}

export function ResultCard({
  calcMode,
  totalSeconds,
  targetPaceSec,
  paceError,
  goalTimeError,
  distanceError,
  distanceVal,
  distanceUnit,
  paceStr,
  goalTimeStr,
  paceUnit,
}: ResultCardProps) {
  return (
    <>
      <div
        style={styles.resultCard}
        aria-live="polite"
        data-result-card
      >
        <div style={styles.resultValue}>
          {calcMode === 'time'
            ? totalSeconds == null
              ? '—'
              : formatHMS(totalSeconds)
            : targetPaceSec == null
            ? '—'
            : formatHMS(targetPaceSec)}
        </div>
        <div style={styles.resultLabel}>
          {calcMode === 'time' ? 'Total Time' : 'Target Pace'}
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  observerTarget: {
    height: '1px',
    width: '100%',
    pointerEvents: 'none',
    visibility: 'hidden',
    marginTop: 16,
  },

  resultCard: {
    marginTop: 4,
    padding: 16,
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    background: 'var(--bg-card)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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

  error: {
    marginTop: 8,
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    color: '#dc2626',
    fontSize: '0.85rem',
  },
}
