import { formatHMS } from './common'
import { RaceProfile } from '../types'

interface SplitData {
  label: string
  cumulativeSeconds: number
  grade: number | null
  targetPace: number | null
  priority: number
}

interface PrintPaceBandOptions {
  primarySplits: SplitData[]
  totalDistance: number
  distanceUnit: 'mi' | 'km'
  paceUnit: 'mi' | 'km'
  paceSecondsPerUnit: number
  raceProfile: RaceProfile | null
  pacingStrategy: 'even-pace' | 'even-effort'
}

export function printPaceBand({
  primarySplits,
  totalDistance,
  distanceUnit,
  paceUnit,
  paceSecondsPerUnit,
  raceProfile,
  pacingStrategy,
}: PrintPaceBandOptions) {
  const totalTime =
    (totalDistance * paceSecondsPerUnit) / (paceUnit === 'mi' ? 1 : 1.609344)

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pace Band</title>
        <style>
          @page {
            size: letter;
            margin: 0.25in;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.3;
            margin: 0;
            padding: 12px;
            width: 2in;
            height: 4in;
            background: white;
            color: black;
          }
          .header {
            text-align: center;
            font-size: 10px;
            margin-bottom: 8px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
            color: #666;
          }
          .race-info {
            text-align: center;
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 13px;
          }
          .total-time {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 12px;
            border: 1px solid #000;
            padding: 6px;
          }
          .splits-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          .splits-table th {
            font-size: 11px;
            padding: 3px 2px;
            text-align: center;
            border-bottom: 1px solid #000;
            font-weight: bold;
          }
          .splits-table td {
            font-size: 12px;
            padding: 2px 2px;
            text-align: center;
            border-bottom: 1px solid #ccc;
          }
          .splits-table .mile-label {
            text-align: center;
            font-weight: bold;
            width: 20%;
            border-right: 1px solid #000;
          }
          .splits-table .time {
            font-weight: bold;
          }
          .grade-col {
            font-size: 11px;
            font-weight: bold;
            width: 15%;
          }
          .uphill { color: #d73027; }
          .downhill { color: #1a9850; }
          .footer {
            text-align: center;
            font-size: 9px;
            margin-top: 8px;
            border-top: 1px solid #ccc;
            padding-top: 4px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">NBR PACE CALCULATOR</div>
        
        ${raceProfile ? `<div class="race-info">${raceProfile.name}</div>` : ''}
        
        <div class="total-time">
          Total: ${formatHMS(totalTime)}
        </div>
        
        <table class="splits-table">
          <thead>
            <tr>
              <th>${distanceUnit === 'mi' ? 'Mile' : 'KM'}</th>
              <th>Time</th>
              ${raceProfile ? '<th>%</th>' : ''}
              ${
                raceProfile
                  ? `<th>${
                      pacingStrategy === 'even-pace' ? 'GAP' : 'Pace'
                    }</th>`
                  : ''
              }
            </tr>
          </thead>
          <tbody>
            ${primarySplits
              .map((split) => {
                // Extract mile/km number from label
                let mileNumber = ''
                if (split.label === 'Finish') {
                  mileNumber = totalDistance.toFixed(1)
                } else if (split.label.startsWith('Mile ')) {
                  mileNumber = split.label.replace('Mile ', '')
                } else if (split.label.endsWith(' km')) {
                  mileNumber = split.label.replace(' km', '')
                } else {
                  mileNumber = split.label
                    .replace('Mile ', '')
                    .replace(' km', '')
                }

                return `
            <tr>
              <td class="mile-label">${mileNumber}</td>
              <td class="time">${formatHMS(split.cumulativeSeconds)}</td>
              ${
                raceProfile
                  ? `
                <td class="grade-col ${
                  split.grade !== null
                    ? split.grade > 1
                      ? 'uphill'
                      : split.grade < -1
                      ? 'downhill'
                      : ''
                    : ''
                }">
                  ${
                    split.grade !== null
                      ? (split.grade > 0 ? '+' : '') + split.grade
                      : '—'
                  }
                </td>
                <td class="time">${
                  split.targetPace !== null ? formatHMS(split.targetPace) : '—'
                }</td>
              `
                  : ''
              }
            </tr>
          `
              })
              .join('')}
          </tbody>
        </table>
        
        <div class="footer">
          ${totalDistance.toFixed(1)}${distanceUnit} • ${
    paceUnit === 'mi' ? 'per mile' : 'per km'
  } pace
          <br>NBR PACE CALCULATOR
        </div>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    // Small delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
