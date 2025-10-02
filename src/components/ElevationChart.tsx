import React from 'react'
import { RaceProfile, Unit } from '../types'
import {
  LineChart,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ElevationChartProps {
  raceProfile: RaceProfile
  distanceUnit: Unit
}

const StyleSheet = {
  create: (styles: Record<string, React.CSSProperties>) => styles,
}

export const ElevationChart: React.FC<ElevationChartProps> = ({
  raceProfile,
  distanceUnit,
}) => {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { elevationProfile } = raceProfile

  if (!elevationProfile || elevationProfile.length === 0) {
    return null
  }

  // Prepare data for Recharts
  const chartData = elevationProfile.map((point, index) => {
    // Calculate grade at this point
    let grade = 0
    if (index > 0 && index < elevationProfile.length - 1) {
      const prev = elevationProfile[index - 1]
      const next = elevationProfile[index + 1]
      const rise = next.elevation - prev.elevation // in feet
      const run =
        (next.distance - prev.distance) *
        (distanceUnit === 'mi' ? 5280 : 3280.84) // Convert to feet
      grade = run > 0 ? (rise / run) * 100 : 0
    }

    return {
      distance: point.distance,
      elevation: point.elevation,
      grade: grade,
    }
  })

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div style={styles.tooltipContent}>
          <div>
            <strong>
              {Number(label).toFixed(1)} {distanceUnit === 'mi' ? 'mi' : 'km'}
            </strong>
          </div>
          <div>{Math.round(data.elevation)} ft</div>
          <div>
            {data.grade > 0 ? '+' : ''}
            {data.grade.toFixed(1)}% grade
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Elevation Profile - {raceProfile.name}</h3>
      <div style={styles.chartContainer}>
        <ResponsiveContainer
          width="100%"
          height={200}
        >
          <ComposedChart
            data={chartData}
            margin={{
              top: 10,
              right: 12,
              left: 5,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-color)"
              opacity={0.3}
            />
            <XAxis
              dataKey="distance"
              axisLine={{ stroke: 'var(--text-secondary)' }}
              tickLine={{ stroke: 'var(--text-secondary)' }}
              tick={{
                fill: 'var(--text-tertiary)',
                fontSize: 11,
                fontFamily: 'inherit',
              }}
              tickFormatter={(value) => Number(value).toFixed(1)}
              label={{
                value: `Distance (${distanceUnit === 'mi' ? 'miles' : 'km'})`,
                position: 'insideBottom',
                offset: -5,
                style: {
                  textAnchor: 'middle',
                  fill: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                },
              }}
            />
            <YAxis
              dataKey="elevation"
              axisLine={{ stroke: 'var(--text-secondary)' }}
              tickLine={{ stroke: 'var(--text-secondary)' }}
              tick={{
                fill: 'var(--text-tertiary)',
                fontSize: 11,
                fontFamily: 'inherit',
              }}
              width={50}
              label={{
                value: 'Elevation (ft)',
                angle: -90,
                position: 'insideLeft',
                style: {
                  textAnchor: 'middle',
                  fill: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                },
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: '#3b82f6',
                strokeWidth: 1,
                strokeDasharray: '3 3',
              }}
            />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="none"
              fill="url(#elevationGradient)"
              fillOpacity={1}
            />
            <Line
              type="monotone"
              dataKey="elevation"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: '#3b82f6',
                stroke: 'white',
                strokeWidth: 2,
              }}
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient
                id="elevationGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="rgba(59, 130, 246, 0.3)"
                />
                <stop
                  offset="100%"
                  stopColor="rgba(59, 130, 246, 0.05)"
                />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {raceProfile.gpxUrl && (
        <div style={styles.gpxLinkContainer}>
          <a
            href={raceProfile.gpxUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.gpxLink}
          >
            View Route Source Data →
          </a>
        </div>
      )}
    </div>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: '32px 0',
    padding: '10px',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    background: 'var(--bg-card)',
  },

  title: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 16px 0',
    textAlign: 'center',
  },

  chartContainer: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },

  tooltipContent: {
    background: 'var(--bg-card-alt)',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: '12px',
    lineHeight: 1.3,
    color: 'var(--text-primary)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    whiteSpace: 'nowrap',
  },

  hint: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginTop: '12px',
  },

  gpxLinkContainer: {
    textAlign: 'center',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-color)',
  },

  gpxLink: {
    color: 'var(--text-link)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
})
