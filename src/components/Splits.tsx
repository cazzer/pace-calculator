import React from 'react'
import { SplitsProps } from '../types'
import { capitalCase, formatHMS } from '../utils/common'
import { printPaceBand } from '../utils/printPaceBand'
import { buildSplits } from '../utils/buildSplits'
import { hidePacingStrategy } from '../config'

// ---- Component ----
export function Splits({
  paceSecondsPerUnit,
  paceUnit,
  totalDistance,
  distanceUnit,
  showSegmentTimes = false,
  raceProfile = null,
  pacingStrategy = 'even-pace',
  calcMode,
}: SplitsProps) {
  if (
    paceSecondsPerUnit == null ||
    !Number.isFinite(totalDistance) ||
    totalDistance <= 0
  ) {
    return (
      <div style={styles.card}>
        <div style={styles.header}>Splits</div>
        <div style={styles.note}>
          Enter a valid pace and distance to see splits.
        </div>
      </div>
    )
  }

  // Build enhanced splits using the utility function
  const enhancedSplits = buildSplits({
    totalDistance,
    distanceUnit,
    paceUnit,
    paceSecondsPerUnit,
    raceProfile,
    pacingStrategy,
    isGoalTimeMode: calcMode == 'pace',
  })

  // Filter to primary distance markers only for pace band
  const primarySplits = enhancedSplits.filter((split) => {
    // Include whole unit markers (Mile 1, 2km, etc.) and finish
    return split.priority === 2 || split.label === 'Finish'
  })

  const handlePrintPaceBand = () => {
    printPaceBand({
      primarySplits,
      totalDistance,
      distanceUnit,
      paceUnit,
      paceSecondsPerUnit,
      raceProfile,
      pacingStrategy,
    })
  }

  const paceColumnHeader =
    pacingStrategy === 'even-pace' ? 'Grade Adjusted Pace*' : 'Target Pace'

  const paceColumnNote =
    pacingStrategy === 'even-pace'
      ? 'Grade Adjusted Pace shows how hard each segment will feel'
      : 'Target Pace shows what pace to run for consistent effort'

  return (
    <div style={styles.card}>
      <div style={styles.headerContainer}>
        <div style={styles.header}>
          Splits{raceProfile ? ` - ${raceProfile.name}` : ''}
        </div>
        <button
          style={styles.printButton}
          onClick={handlePrintPaceBand}
          title="Print Pace Band"
        >
          🖨️
        </button>
      </div>

      <div style={styles.meta}>
        <div style={styles.metaLine}>
          Pace: {paceUnit === 'mi' ? 'per mile' : 'per kilometer'} · Distance:{' '}
          {distanceUnit.toUpperCase()}
        </div>
        {raceProfile && !hidePacingStrategy && (
          <div style={styles.elevationBadgeLine}>
            <span style={styles.elevationBadge}>
              {capitalCase(pacingStrategy)}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .splits-table th, .splits-table td {
            padding: 6px 2px !important;
            font-size: 0.8rem !important;
          }
          .splits-table .td-elevation, .splits-table .td-gap {
            padding: 6px 1px !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={styles.table}
          className="splits-table"
        >
          <thead>
            <tr>
              <th style={styles.th}>
                <span className="desktop-label">Marker</span>
                <span className="mobile-label">Split</span>
              </th>
              <th style={styles.th}>
                <span className="desktop-label">Distance</span>
                <span className="mobile-label">Dist</span>
              </th>
              {showSegmentTimes && (
                <th style={styles.th}>
                  <span className="desktop-label">Segment</span>
                  <span className="mobile-label">Seg</span>
                </th>
              )}
              <th style={styles.th}>
                <span className="desktop-label">Cumulative</span>
                <span className="mobile-label">Time</span>
              </th>
              {raceProfile && (
                <>
                  <th style={styles.thElevation}>
                    <span className="desktop-label">Elevation</span>
                    <span className="mobile-label">Elev</span>
                  </th>
                  <th style={styles.thElevation}>
                    <span className="desktop-label">Grade</span>
                    <span className="mobile-label">%</span>
                  </th>
                  <th style={styles.thGap}>
                    <span className="desktop-label">{paceColumnHeader}</span>
                    <span className="mobile-label">
                      {pacingStrategy === 'even-pace' ? 'GAP*' : 'Pace'}
                    </span>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {enhancedSplits.map((split, index) => (
              <tr
                key={index}
                style={index % 2 ? styles.trAlt : undefined}
              >
                <td style={split.priority < 2 ? styles.tdItalic : styles.td}>
                  <span className="desktop-label">{split.label}</span>
                  <span className="mobile-label">
                    {split.label
                      .replace('Mile ', 'M')
                      .replace(' km', 'K')
                      .replace('Halfway', 'Half')}
                  </span>
                </td>
                <td
                  style={{
                    ...styles.tdMono,
                    ...(split.priority < 2 ? styles.tdItalic : {}),
                  }}
                >
                  <span className="desktop-label">{split.distanceLabel}</span>
                  <span className="mobile-label">
                    {split.distanceLabel.replace(' mi', '').replace(' km', '')}
                  </span>
                </td>
                {showSegmentTimes && (
                  <td style={styles.tdMono}>
                    {formatHMS(split.segmentSeconds)}
                  </td>
                )}
                <td
                  style={{
                    ...styles.tdMono,
                    ...(split.priority < 2 ? styles.tdItalic : {}),
                  }}
                >
                  {formatHMS(split.cumulativeSeconds)}
                </td>
                {raceProfile && (
                  <>
                    <td style={styles.tdElevation}>
                      {split.elevation !== null && split.priority == 2
                        ? `${split.elevation}'`
                        : '—'}
                    </td>
                    <td
                      style={{
                        ...styles.tdElevation,
                        color:
                          split.grade === null
                            ? 'inherit'
                            : split.grade > 1
                            ? '#d73027'
                            : split.grade < -1
                            ? '#1a9850'
                            : 'inherit',
                      }}
                    >
                      {split.grade !== null &&
                      split.gradeRange !== null &&
                      split.priority == 2 ? (
                        <div>
                          <span>
                            {split.grade > 0 ? '+' : ''}
                            {split.grade}%
                          </span>
                          {Math.abs(
                            split.gradeRange.max - split.gradeRange.min
                          ) > 0.5 && (
                            <div style={styles.gradeRange}>
                              {split.gradeRange.min.toFixed(1)}% to{' '}
                              {split.gradeRange.max.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={styles.tdGap}>
                      {split.targetPace !== null && split.priority == 2 ? (
                        <>
                          <span className="desktop-label">
                            {formatHMS(split.targetPace)}/
                            {paceUnit === 'mi' ? 'mi' : 'km'}
                          </span>
                          <span className="mobile-label">
                            {formatHMS(split.targetPace)}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.note}>
        {raceProfile ? (
          <>
            * {paceColumnNote} accounting for elevation changes.{' '}
            <span style={{ color: '#d73027' }}>
              <span className="desktop-label">Red grades</span>
              <span className="mobile-label">Red</span>
            </span>{' '}
            indicate uphill,{' '}
            <span style={{ color: '#1a9850' }}>
              <span className="desktop-label">green grades</span>
              <span className="mobile-label">green</span>
            </span>{' '}
            indicate downhill.
          </>
        ) : (
          <>
            * 5K splits shown regardless of unit.{' '}
            <span className="desktop-label">"Halfway"</span>
            <span className="mobile-label">"Half"</span> = 50% of total
            distance.
          </>
        )}
      </div>
    </div>
  )
}

// ---- Helper Functions ----

// ---- Styles ----
const styles: Record<string, React.CSSProperties> = {
  card: {
    marginTop: 16,
    padding: 16,
    border: '1px solid var(--border-color)',
    borderColor: 'var(--border-color)',
    borderRadius: 12,
    background: 'var(--bg-card-alt)',
    backdropFilter: 'blur(10px)',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  header: {
    fontWeight: 700,
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
    margin: 0,
    flexGrow: 1,
    paddingLeft: 32,
  },
  printButton: {
    background: 'none',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    padding: '6px 8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
  },
  meta: {
    color: 'var(--text-tertiary)',
    fontSize: '.9rem',
    marginBottom: 8,
  },
  metaLine: {
    color: 'var(--text-tertiary)',
    fontSize: '.9rem',
  },
  elevationBadgeLine: {
    marginTop: 4,
  },
  elevationBadge: {
    marginLeft: 8,
    padding: '2px 8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: 12,
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '.95rem',
  },
  th: {
    textAlign: 'center',
    borderBottom: '1px solid var(--border-table)',
    padding: '8px 6px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  td: {
    padding: '8px 6px',
    verticalAlign: 'middle',
    color: 'var(--text-primary)',
  },
  tdMono: {
    padding: '8px 6px',
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    color: 'var(--text-primary)',
  },
  tdItalic: {
    padding: '8px 6px',
    verticalAlign: 'middle',
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
  },
  trAlt: {
    background: 'var(--bg-card)',
  },
  note: {
    marginTop: 8,
    fontSize: '.8rem',
    color: 'var(--text-muted)',
  },
  thElevation: {
    textAlign: 'center',
    borderBottom: '1px solid var(--border-table)',
    padding: '8px 6px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    background:
      'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  },
  thGap: {
    textAlign: 'center',
    borderBottom: '1px solid var(--border-table)',
    padding: '8px 6px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    background:
      'linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(230, 126, 34, 0.1) 100%)',
  },
  tdElevation: {
    padding: '8px 6px',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    color: 'var(--text-primary)',
    background: 'rgba(102, 126, 234, 0.03)',
    fontSize: '0.9rem',
  },
  tdGap: {
    padding: '8px 6px',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    color: 'var(--text-primary)',
    background: 'rgba(231, 76, 60, 0.05)',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  gradeRange: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    lineHeight: 1.1,
    marginTop: 1,
  },
  disclaimer: {
    backgroundColor: 'var(--bg-warning, #fff3cd)',
    border: '1px solid var(--border-warning, #ffeaa7)',
    borderRadius: '6px',
    padding: '12px',
    margin: '16px 0',
    fontSize: '0.9rem',
    lineHeight: '1.4',
    color: 'var(--text-warning, #856404)',
  },
}
