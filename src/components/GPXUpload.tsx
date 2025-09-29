import React from 'react'
import {
  parseGPXFile,
  simplifyTrackPoints,
  gpxToElevationProfile,
  GPXData,
} from '../utils/gpx'
import {
  compressElevationData,
  generateElevationHash,
} from '../utils/compression'
import { RaceProfile } from '../elevation'

interface GPXUploadProps {
  onGPXLoaded: (profile: RaceProfile) => void
  onError: (error: string) => void
  onSuccess?: () => void // Add optional success callback
}

export function GPXUpload({ onGPXLoaded, onError, onSuccess }: GPXUploadProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const processGPXFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      onError('Please select a valid GPX file')
      return
    }

    setIsProcessing(true)

    try {
      const content = await file.text()
      const gpxData: GPXData = await parseGPXFile(content)

      // Validate the GPX data
      if (gpxData.totalDistance < 0.1) {
        throw new Error(
          'GPX file must contain at least 0.1 miles of track data'
        )
      }

      // Remove the 50-mile limit - let's be more generous
      if (gpxData.totalDistance > 200) {
        throw new Error('GPX file is too long (maximum 200 miles supported)')
      }

      // Also check file size as a reasonable limit
      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        throw new Error('GPX file is too large (maximum 10MB supported)')
      }

      // Simplify the track points to reduce data size
      const simplifiedPoints = simplifyTrackPoints(gpxData.trackPoints, 0.001)
      const elevationProfile = gpxToElevationProfile({
        ...gpxData,
        trackPoints: simplifiedPoints,
      })

      // Create a custom race profile
      const customProfile: RaceProfile = {
        name: gpxData.name || file.name.replace('.gpx', ''),
        distance: gpxData.totalDistance,
        unit: 'mi',
        elevationProfile,
        isCustom: true,
        elevationGain: gpxData.elevationGain,
        elevationLoss: gpxData.elevationLoss,
      }

      // Store in localStorage for persistence
      const hash = generateElevationHash(elevationProfile)
      const storageKey = `elevation_${hash}`
      const storageData = {
        profile: customProfile,
        created: Date.now(),
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(storageData))
      } catch {
        // localStorage full - continue without storage
        console.warn('Could not store GPX data in localStorage')
      }

      onGPXLoaded(customProfile)

      // Call success callback to trigger accordion close and scroll
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      onError(
        error instanceof Error ? error.message : 'Failed to process GPX file'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processGPXFile(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processGPXFile(files[0])
    }
  }

  return (
    <div style={styles.container}>
      <h4 style={styles.header}>Upload Custom GPX Course</h4>
      <div style={styles.disclaimer}>
        Upload a GPX file to use your own course elevation profile for pacing
        calculations.
        <br />
        *Wicked experimental*
      </div>

      <div
        style={{
          ...styles.dropZone,
          ...(dragActive ? styles.dropZoneActive : {}),
          ...(isProcessing ? styles.dropZoneProcessing : {}),
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx"
          onChange={handleFileSelect}
          style={styles.hiddenInput}
          disabled={isProcessing}
        />

        <div style={styles.dropZoneContent}>
          <div style={styles.uploadIcon}>📊</div>
          {isProcessing ? (
            <>
              <div style={styles.processingText}>Processing GPX file...</div>
              <div style={styles.spinner}></div>
            </>
          ) : (
            <>
              <div style={styles.uploadText}>
                Drop your GPX file here or click to browse
              </div>
            </>
          )}
        </div>
      </div>

      <div style={styles.helpText}>
        <strong>Tips:</strong>
        <ul style={styles.tipsList}>
          <li>GPX files from Strava, Garmin, or other GPS devices work best</li>
          <li>Make sure your GPX includes elevation data</li>
          <li>Files are processed locally in your browser for privacy</li>
        </ul>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: 24,
  },

  header: {
    fontSize: '0.95rem',
    fontWeight: 600,
    margin: '8px 0 8px 0',
    color: 'var(--text-secondary)',
  },

  disclaimer: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },

  dropZone: {
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: 'var(--border-color)',
    borderRadius: 8,
    padding: '24px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'var(--bg-card)',
    position: 'relative',
  },

  dropZoneActive: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
  },

  dropZoneProcessing: {
    cursor: 'not-allowed',
    opacity: 0.7,
  },

  hiddenInput: {
    display: 'none',
  },

  dropZoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },

  uploadIcon: {
    fontSize: '2rem',
    marginBottom: 8,
  },

  uploadText: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },

  uploadSubtext: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },

  processingText: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },

  spinner: {
    width: 20,
    height: 20,
    border: '2px solid var(--border-color)',
    borderTop: '2px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  helpText: {
    marginTop: 16,
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textAlign: 'left',
  },

  tipsList: {
    margin: '8px 0 0 0',
    paddingLeft: 20,
  },
}
