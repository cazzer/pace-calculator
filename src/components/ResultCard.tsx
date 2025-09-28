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
  const [showStickyHeader, setShowStickyHeader] = React.useState(false)
  const observerRef = React.useRef<HTMLDivElement>(null)

  // Set up intersection observer for sticky header
  // React.useEffect(() => {
  //   const observer = new IntersectionObserver(
  //     ([entry]) => {
  //       setShowStickyHeader(!entry.isIntersecting)
  //     },
  //     {
  //       threshold: 0,
  //       rootMargin: '0px 0px -100px 0px',
  //     }
  //   )

  //   if (observerRef.current) {
  //     observer.observe(observerRef.current)
  //   }

  //   return () => observer.disconnect()
  // }, [])

  return (
    <>
      {/* Observer target positioned above result card */}
      <div
        ref={observerRef}
        style={styles.observerTarget}
      />

      {/* Result Card - transforms into sticky header */}
      <div
        style={{
          ...styles.resultCard,
          ...(showStickyHeader ? styles.resultCardSticky : {}),
        }}
        className={showStickyHeader ? 'result-card-sticky' : ''}
        aria-live="polite"
      >
        <div style={showStickyHeader ? styles.stickyContent : undefined}>
          <div style={showStickyHeader ? styles.stickyResultCard : undefined}>
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

          {/* Additional fields only show in sticky mode */}
          {showStickyHeader && (
            <div style={styles.stickyFields}>
              <div style={styles.stickyField}>
                <div style={styles.stickyFieldValue}>
                  {Number.isFinite(distanceVal) ? distanceVal : '—'}{' '}
                  {distanceUnit}
                </div>
                <div style={styles.stickyFieldLabel}>Distance</div>
              </div>

              <div style={styles.stickyField}>
                <div style={styles.stickyFieldValue}>
                  {calcMode === 'time' ? paceStr || '—' : goalTimeStr || '—'}
                </div>
                <div style={styles.stickyFieldLabel}>
                  {calcMode === 'time' ? `Pace (${paceUnit})` : 'Goal Time'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error messages only show in normal mode */}
        {!showStickyHeader && (
          <>
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
          </>
        )}
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
    position: 'relative',
  },

  resultCardSticky: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backgroundColor: 'inherit',
    backdropFilter: 'blur(20px)',
    borderColor: 'var(--border-color)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    margin: '0 calc(-1 * var(--page-padding, 16px))',
    borderRadius: 0,
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
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
}
