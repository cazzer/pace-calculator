import React from 'react'
import { SplitsProps } from './types'
import { convertDistanceTo, formatHMS } from './utils'

// ---- Component ----
export function Splits(props: SplitsProps) {
  const {
    paceSecondsPerUnit,
    paceUnit,
    totalDistance,
    distanceUnit,
    showSegmentTimes = false,
  } = props

  // Defensive checks
  if (
    paceSecondsPerUnit == null ||
    !Number.isFinite(totalDistance) ||
    totalDistance <= 0
  ) {
    return (
      <div style={splitStyles.card}>
        <div style={splitStyles.header}>Splits</div>
        <div style={splitStyles.note}>
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

  return (
    <div style={splitStyles.card}>
      <div style={splitStyles.header}>Splits</div>
      <div style={splitStyles.meta}>
        Pace: {paceUnit === 'mi' ? 'per mile' : 'per kilometer'} · Distance:{' '}
        {distanceUnit.toUpperCase()}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={splitStyles.table}>
          <thead>
            <tr>
              <th style={splitStyles.th}>Marker</th>
              <th style={splitStyles.th}>Distance</th>
              {showSegmentTimes && <th style={splitStyles.th}>Segment</th>}
              <th style={splitStyles.th}>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={idx}
                style={idx % 2 ? splitStyles.trAlt : undefined}
              >
                <td
                  style={r.priority < 2 ? splitStyles.tdItalic : splitStyles.td}
                >
                  {r.label}
                </td>
                <td style={splitStyles.tdMono}>{r.distanceLabel}</td>
                {showSegmentTimes && (
                  <td style={splitStyles.tdMono}>
                    {formatHMS(r.segmentSeconds)}
                  </td>
                )}
                <td style={splitStyles.tdMono}>
                  {formatHMS(r.cumulativeSeconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={splitStyles.note}>
        * 5K splits shown regardless of unit. "Halfway" = 50% of total distance.
      </div>
    </div>
  )
}

// ---- Styles ----
const splitStyles: Record<string, React.CSSProperties> = {
  card: {
    marginTop: 16,
    padding: 16,
    border: '1px solid var(--border-color)',
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
}
