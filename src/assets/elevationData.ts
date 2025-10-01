import { ElevationPoint } from '../types'

// Import JSON elevation data
import nycMarathonData from './nycMarathon.json'
import bostonMarathonData from './bostonMarathon.json'
import chicagoMarathonData from './chicagoMarathon.json'
import londonMarathonData from './londonMarathon.json'
import berlinMarathonData from './berlinMarathon.json'
import tokyoMarathonData from './tokyoMarathon.json'
import sydneyMarathonData from './sydneyMarathon.json'
import unitedNycHalfData from './nycHalf.json'

// Conversion constant
const METERS_TO_FEET = 3.28084

// Helper function to convert elevation data from meters to feet
const convertElevationData = (data: any[]): ElevationPoint[] =>
  data.map((point) => ({
    distance: point.distance, // Distance stays in original units (miles)
    elevation: point.elevation * METERS_TO_FEET, // Convert meters to feet
  }))

// Type and convert the imported JSON data to ElevationPoint arrays with feet
export const NYC_MARATHON_ELEVATION: ElevationPoint[] = nycMarathonData
export const BOSTON_MARATHON_ELEVATION: ElevationPoint[] = bostonMarathonData
export const CHICAGO_MARATHON_ELEVATION: ElevationPoint[] = chicagoMarathonData
export const LONDON_MARATHON_ELEVATION: ElevationPoint[] = londonMarathonData
export const BERLIN_MARATHON_ELEVATION: ElevationPoint[] = berlinMarathonData
export const TOKYO_MARATHON_ELEVATION: ElevationPoint[] = tokyoMarathonData
export const SYDNEY_MARATHON_ELEVATION: ElevationPoint[] = sydneyMarathonData
export const UNITED_NYC_HALF_ELEVATION: ElevationPoint[] = unitedNycHalfData
