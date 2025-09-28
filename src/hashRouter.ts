import { Unit } from './types'
import { RACE_PROFILES } from './elevation'

export interface AppState {
  distance?: number
  distanceUnit?: Unit
  pace?: string
  paceUnit?: Unit
  goalTime?: string
  mode?: 'time' | 'pace'
  race?: string
  pacingStrategy?: 'even-pace' | 'even-effort'
}

export function parseUrlParams(search: string): AppState {
  const params = new URLSearchParams(search)
  const state: AppState = {}

  // Parse distance
  const distance = params.get('distance')
  if (distance && !isNaN(Number(distance))) {
    state.distance = Number(distance)
  }

  // Parse distance unit
  const distanceUnit = params.get('distanceUnit')
  if (distanceUnit === 'mi' || distanceUnit === 'km') {
    state.distanceUnit = distanceUnit
  }

  // Parse pace
  const pace = params.get('pace')
  if (pace) {
    state.pace = decodeURIComponent(pace)
  }

  // Parse pace unit
  const paceUnit = params.get('paceUnit')
  if (paceUnit === 'mi' || paceUnit === 'km') {
    state.paceUnit = paceUnit
  }

  // Parse goal time
  const goalTime = params.get('goalTime')
  if (goalTime) {
    state.goalTime = decodeURIComponent(goalTime)
  }

  // Parse calculation mode
  const mode = params.get('mode')
  if (mode === 'time' || mode === 'pace') {
    state.mode = mode
  }

  // Parse race preset
  const race = params.get('race')
  if (race && RACE_PROFILES[race]) {
    state.race = race
  }

  // Parse pacing strategy
  const pacingStrategy = params.get('pacingStrategy')
  if (pacingStrategy === 'even-pace' || pacingStrategy === 'even-effort') {
    state.pacingStrategy = pacingStrategy
  }

  return state
}

export function serializeUrlParams(state: AppState): string {
  const params = new URLSearchParams()

  if (state.distance !== undefined) {
    params.set('distance', state.distance.toString())
  }

  if (state.distanceUnit) {
    params.set('distanceUnit', state.distanceUnit)
  }

  if (state.pace) {
    params.set('pace', encodeURIComponent(state.pace))
  }

  if (state.paceUnit) {
    params.set('paceUnit', state.paceUnit)
  }

  if (state.goalTime) {
    params.set('goalTime', encodeURIComponent(state.goalTime))
  }

  if (state.mode) {
    params.set('mode', state.mode)
  }

  if (state.race) {
    params.set('race', state.race)
  }

  if (state.pacingStrategy) {
    params.set('pacingStrategy', state.pacingStrategy)
  }

  return params.toString()
}

// Backward compatibility
export function parseHashParams(): AppState {
  const hash = window.location.hash.slice(1)
  const search = hash.startsWith('?') ? hash.slice(1) : hash
  return parseUrlParams(search)
}

// Generate shareable URLs for race presets
export function generateRaceUrl(raceKey: string): string {
  const race = RACE_PROFILES[raceKey]
  if (!race) return window.location.href.split('?')[0]

  const state: AppState = {
    race: raceKey,
    distance: race.distance,
    distanceUnit: race.unit,
    mode: 'time',
  }

  const search = serializeUrlParams(state)
  return `${window.location.href.split('?')[0]}?${search}`
}
