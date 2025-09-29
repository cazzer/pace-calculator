import { ElevationPoint } from '../elevation'

// Import JSON elevation data
import nycMarathonData from './nycMarathon.json'
import bostonMarathonData from './bostonMarathon.json'
import chicagoMarathonData from './chicagoMarathon.json'
import londonMarathonData from './londonMarathon.json'
import berlinMarathonData from './berlinMarathon.json'
import tokyoMarathonData from './tokyoMarathon.json'
import sydneyMarathonData from './sydneyMarathon.json'
import unitedNycHalfData from './nycHalf.json'

// Type the imported JSON data as ElevationPoint arrays
export const NYC_MARATHON_ELEVATION: ElevationPoint[] =
  nycMarathonData as ElevationPoint[]
export const BOSTON_MARATHON_ELEVATION: ElevationPoint[] =
  bostonMarathonData as ElevationPoint[]
export const CHICAGO_MARATHON_ELEVATION: ElevationPoint[] =
  chicagoMarathonData as ElevationPoint[]
export const LONDON_MARATHON_ELEVATION: ElevationPoint[] =
  londonMarathonData as ElevationPoint[]
export const BERLIN_MARATHON_ELEVATION: ElevationPoint[] =
  berlinMarathonData as ElevationPoint[]
export const TOKYO_MARATHON_ELEVATION: ElevationPoint[] =
  tokyoMarathonData as ElevationPoint[]
export const SYDNEY_MARATHON_ELEVATION: ElevationPoint[] =
  sydneyMarathonData as ElevationPoint[]
export const UNITED_NYC_HALF_ELEVATION: ElevationPoint[] =
  unitedNycHalfData as ElevationPoint[]
