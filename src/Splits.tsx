import React from 'react'
import { SplitsProps } from './types'
import { convertDistanceTo, formatHMS } from './utils'
import {
  RaceProfile,
  getAverageGrade,
  calculateGradeAdjustedPace,
  getElevationAtDistance,
  calculateActualPaceForTargetGAP,
} from './elevation'

// ---- Component ----
export function Splits({
  paceSecondsPerUnit,
  paceUnit,
  totalDistance,
  distanceUnit,
  showSegmentTimes = false,
  raceProfile = null,
  pacingStrategy = 'even-pace',
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

  // Build split markers (in a neutral representation of "distanceUnit" for labeling)
  // 1) Every whole distanceUnit (mile or km)
  // 2) Every 5K (5, 10, 15, ... km) regardless of mode
  // 3) Halfway point
  const markers: Array<{
    label: string
    distanceInDistanceUnit: number
    priority: number
  }> = []
  const EPS = 1e-6

  // 1) Whole-unit splits
  const wholeMax = Math.floor(totalDistance + EPS)
  for (let i = 1; i <= wholeMax; i++) {
    markers.push({
      label: distanceUnit === 'mi' ? `Mile ${i}` : `${i} km`,
      distanceInDistanceUnit: i,
      priority: 2, // normal priority
    })
  }

  // 2) 5K splits (operate in km, convert to distanceUnit for labeling & calc)
  //    5, 10, 15 ... up to total in km
  const totalKm = convertDistanceTo('km', totalDistance, distanceUnit)
  const fiveKCount = Math.floor(totalKm / 5 + EPS)
  for (let k = 1; k <= fiveKCount; k++) {
    const kmAtMark = k * 5 // 5, 10, 15...
    const distInDistanceUnit = convertDistanceTo(distanceUnit, kmAtMark, 'km')
    markers.push({
      label: `${kmAtMark}K`,
      distanceInDistanceUnit: distInDistanceUnit,
      priority: 1, // higher priority label if coincident with a whole split,
    })
  }

  // 3) Halfway split
  const halfway = totalDistance / 2
  markers.push({
    label: 'Halfway',
    distanceInDistanceUnit: halfway,
    priority: 0, // highest priority label if duplicates overlap
  })

  // Deduplicate by distance within EPS; keep the highest-priority label
  const dedupMap = new Map<
    number,
    { label: string; d: number; priority: number }
  >()
  for (const m of markers) {
    // Normalize distance to a rounded key to handle floating-point
    const key = Math.round(m.distanceInDistanceUnit / 1e-4) * 1e-4 // ~1e-4 resolution
    const prev = dedupMap.get(key)
    if (!prev || m.priority < prev.priority) {
      dedupMap.set(key, {
        label: m.label,
        d: m.distanceInDistanceUnit,
        priority: m.priority,
      })
    }
  }

  // Sort ascending by distance
  const sorted = Array.from(dedupMap.values()).sort((a, b) => a.d - b.d)

  // Compute times
  type Row = {
    label: string
    distanceLabel: string // e.g., "3.11 mi" or "5.00 km"
    cumulativeSeconds: number // time from start to this marker
    segmentSeconds: number // time from previous marker to this marker
    priority: number // priority for styling
  }

  const rows: Row[] = []
  let prevDistanceInPaceUnit = 0

  for (const entry of sorted) {
    // Distance for labeling: show in the user's distanceUnit
    const dLabelNum = entry.d

    // Convert the marker distance into the "pace unit" to compute time
    const markerDistanceInPaceUnit = convertDistanceTo(
      paceUnit,
      entry.d,
      distanceUnit
    )

    const cumulativeSeconds = markerDistanceInPaceUnit * paceSecondsPerUnit
    const segmentDistanceInPaceUnit = Math.max(
      0,
      markerDistanceInPaceUnit - prevDistanceInPaceUnit
    )
    const segmentSeconds = segmentDistanceInPaceUnit * paceSecondsPerUnit

    rows.push({
      label: entry.label,
      distanceLabel:
        distanceUnit === 'mi'
          ? `${dLabelNum.toFixed(2)} mi`
          : `${dLabelNum.toFixed(2)} km`,
      cumulativeSeconds,
      segmentSeconds,
      priority: entry.priority,
    })

    prevDistanceInPaceUnit = markerDistanceInPaceUnit
  }

  // Add final finish line if the last marker is not exactly the total distance
  const lastDistance = sorted.length ? sorted[sorted.length - 1].d : 0
  if (Math.abs(lastDistance - totalDistance) > 1e-4) {
    const totalInPaceUnit = convertDistanceTo(
      paceUnit,
      totalDistance,
      distanceUnit
    )
    const seg = Math.max(0, totalInPaceUnit - prevDistanceInPaceUnit)
    rows.push({
      label: 'Finish',
      distanceLabel:
        distanceUnit === 'mi'
          ? `${totalDistance.toFixed(2)} mi`
          : `${totalDistance.toFixed(2)} km`,
      cumulativeSeconds: totalInPaceUnit * paceSecondsPerUnit,
      segmentSeconds: seg * paceSecondsPerUnit,
      priority: 3, // lowest priority for finish line
    })
  }

  // Enhance splits with elevation data if race profile is available
  const enhancedSplits = rows.map((split, index) => {
    if (!raceProfile)
      return { ...split, elevation: null, grade: null, targetPace: null }

    // Convert split distance to profile units (miles)
    // Extract distance from the split's distanceLabel or calculate from cumulative time
    let distanceInMiles: number

    // Parse distance from distanceLabel (e.g., "13.11 mi" or "21.10 km")
    const distanceMatch = split.distanceLabel.match(/([\d.]+)\s*(mi|km)/)
    if (distanceMatch) {
      const distanceValue = parseFloat(distanceMatch[1])
      const unit = distanceMatch[2]
      distanceInMiles = unit === 'mi' ? distanceValue : distanceValue / 1.609344
    } else {
      // Fallback: calculate from pace and time
      const distanceInPaceUnits = split.cumulativeSeconds / paceSecondsPerUnit
      distanceInMiles =
        paceUnit === 'mi' ? distanceInPaceUnits : distanceInPaceUnits / 1.609344
    }

    // Get previous distance for grade calculation
    let prevDistanceInMiles = 0
    if (index > 0) {
      const prevSplit = rows[index - 1]
      const prevDistanceMatch =
        prevSplit.distanceLabel.match(/([\d.]+)\s*(mi|km)/)
      if (prevDistanceMatch) {
        const prevDistanceValue = parseFloat(prevDistanceMatch[1])
        const prevUnit = prevDistanceMatch[2]
        prevDistanceInMiles =
          prevUnit === 'mi' ? prevDistanceValue : prevDistanceValue / 1.609344
      } else {
        const prevDistanceInPaceUnits =
          prevSplit.cumulativeSeconds / paceSecondsPerUnit
        prevDistanceInMiles =
          paceUnit === 'mi'
            ? prevDistanceInPaceUnits
            : prevDistanceInPaceUnits / 1.609344
      }
    }

    const elevation = getElevationAtDistance(
      raceProfile.elevationProfile,
      distanceInMiles
    )
    const grade = getAverageGrade(
      raceProfile.elevationProfile,
      prevDistanceInMiles,
      distanceInMiles
    )

    // Calculate target pace based on pacing strategy
    let targetPace: number
    if (pacingStrategy === 'even-pace') {
      // Show what the pace will feel like (GAP)
      targetPace = calculateGradeAdjustedPace(paceSecondsPerUnit, grade)
    } else {
      // Show what actual pace to run for consistent effort
      targetPace = calculateActualPaceForTargetGAP(paceSecondsPerUnit, grade)
    }

    return {
      ...split,
      elevation: Math.round(elevation),
      grade: Math.round(grade * 10) / 10,
      targetPace,
    }
  })

  const paceColumnHeader =
    pacingStrategy === 'even-pace' ? 'Grade Adjusted Pace' : 'Target Pace'

  const paceColumnNote =
    pacingStrategy === 'even-pace'
      ? 'Grade Adjusted Pace shows how hard each segment will feel'
      : 'Target Pace shows what pace to run for consistent effort'

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        Splits{raceProfile ? ` - ${raceProfile.name}` : ''}
      </div>
      <div style={styles.meta}>
        <div style={styles.metaLine}>
          Pace: {paceUnit === 'mi' ? 'per mile' : 'per kilometer'} · Distance:{' '}
          {distanceUnit.toUpperCase()}
        </div>
        {raceProfile && (
          <div style={styles.elevationBadgeLine}>
            <span style={styles.elevationBadge}>📈 Elevation Profile</span>
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
                      {pacingStrategy === 'even-pace' ? 'GAP' : 'Pace'}
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
                <td style={styles.tdMono}>
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
                <td style={styles.tdMono}>
                  {formatHMS(split.cumulativeSeconds)}
                </td>
                {raceProfile && (
                  <>
                    <td style={styles.tdElevation}>
                      {split.elevation !== null ? `${split.elevation}'` : '—'}
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
                      {split.grade !== null
                        ? `${split.grade > 0 ? '+' : ''}${split.grade}%`
                        : '—'}
                    </td>
                    <td style={styles.tdGap}>
                      {split.targetPace !== null ? (
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
  header: {
    fontWeight: 700,
    marginBottom: 8,
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
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
    textAlign: 'left',
    borderBottom: '1px solid var(--border-table)',
    padding: '8px 6px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  td: {
    padding: '8px 6px',
    verticalAlign: 'top',
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
    verticalAlign: 'top',
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
    textAlign: 'left',
    borderBottom: '1px solid var(--border-table)',
    padding: '8px 6px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    background:
      'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  },
  thGap: {
    textAlign: 'left',
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
}
