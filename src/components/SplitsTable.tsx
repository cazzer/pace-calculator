import React from 'react'
import { formatTime as it } from '../utils'
import { RaceProfile, getElevationAtDistance, calculateWeightedGrade } from '../elevation'

// ...existing interface...

export function SplitsTable({
  paceSecondsPerUnit,
  paceUnit,
  totalDistance,
  distanceUnit,
  showSegmentTimes = false,
  raceProfile = null,
  pacingStrategy = 'even-pace',
}: SplitsTableProps) {
  // ...existing logic for calculating splits...

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Filter splits to show only primary distance markers
    const primarySplits = splitsData.filter(split => {
      // Keep finish line
      if (split.label === 'Finish') return true
      
      // Keep mile/km markers (not 5K or halfway)
      if (split.label.match(/^(Mile \d+|\d+ km)$/)) return true
      
      return false
    })

    const raceInfo = raceProfile ? raceProfile.name : `${totalDistance.toFixed(1)} ${distanceUnit.toUpperCase()}`
    const totalTime = primarySplits[primarySplits.length - 1]?.cumulativeSeconds
    const totalTimeStr = totalTime ? it(totalTime) : '—'
    const paceInfo = `${it(paceSecondsPerUnit)}/${paceUnit === 'mi' ? 'mi' : 'km'}`
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pace Band - ${raceInfo}</title>
        <style>
          @page {
            size: 2.5in 11in;
            margin: 0.25in;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 8pt;
              line-height: 1.2;
            }
          }
          
          body {
            width: 2in;
            margin: 0 auto;
            padding: 8px;
            font-family: 'Courier New', monospace;
            font-size: 8pt;
            line-height: 1.2;
            background: white;
            color: black;
          }
          
          .header {
            text-align: center;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          
          .brand {
            font-size: 6pt;
            color: #666;
            margin-bottom: 2px;
          }
          
          .race-name {
            font-weight: bold;
            font-size: 9pt;
            margin-bottom: 1px;
          }
          
          .total-time {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 1px;
          }
          
          .pace-info {
            font-size: 7pt;
            color: #666;
          }
          
          .splits {
            margin: 6px 0;
          }
          
          .split-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1px;
            padding: 1px 0;
            border-bottom: 1px dotted #ddd;
          }
          
          .split-row:last-child {
            border-bottom: none;
            font-weight: bold;
          }
          
          .split-marker {
            font-size: 7pt;
            width: 50%;
          }
          
          .split-time {
            font-size: 7pt;
            text-align: right;
            font-family: 'Courier New', monospace;
          }
          
          .footer {
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 4px;
            margin-top: 6px;
          }
          
          .footer-brand {
            font-size: 6pt;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">NBR PACE CALCULATOR</div>
          <div class="race-name">${raceInfo}</div>
          <div class="total-time">${totalTimeStr}</div>
          <div class="pace-info">${paceInfo} target pace</div>
        </div>
        
        <div class="splits">
          ${primarySplits.map(split => `
            <div class="split-row">
              <div class="split-marker">${split.label}</div>
              <div class="split-time">${it(split.cumulativeSeconds)}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <div class="footer-brand">NBR PACE CALCULATOR</div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Trigger print dialog
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.headerContainer}>
        <div style={styles.header}>
          Splits{raceProfile ? ` - ${raceProfile.name}` : ''}
        </div>
        <button 
          style={styles.printButton}
          onClick={handlePrint}
          title="Print Pace Band"
        >
          🖨️
        </button>
      </div>
      
      <div style={styles.meta}>
        {/* ...existing meta content... */}
      </div>

      <style>{/* ...existing styles... */}</style>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table} className="splits-table">
          {/* ...existing table content... */}
        </table>
      </div>

      <div style={styles.note}>
        {/* ...existing note content... */}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  // ...existing styles...

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
  },

  printButton: {
    padding: '6px 10px',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },

  // ...existing styles...
}
