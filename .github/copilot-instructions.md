# Pace Calculator - AI Agent Instructions

## Project Overview

This is a React TypeScript pace calculator with a unique architecture designed for **dual deployment modes**: standard web app and single-file embeddable widget. The app calculates running paces with elevation-aware adjustments for major marathons.

## Architecture & Key Patterns

### Dual Build System
- **Standard build**: `npm run build` → `dist/` (normal Vite output)
- **Embed build**: `npm run build:embed` → `dist-embed/embed.html` (single self-contained file)
- Uses `vite-plugin-singlefile` to inline ALL dependencies into one HTML file
- Embed version has custom CSS overrides for Squarespace integration (`src/embed.tsx`)

### Styling Strategy: Inline-Only
```typescript
// Use this pattern throughout - NO separate CSS files
const StyleSheet = { create: (styles: Record<string, React.CSSProperties>) => styles }

const styles = StyleSheet.create({
  container: { padding: '20px', backgroundColor: '#f5f5f5' }
})
```
This enables the single-file build by eliminating external CSS dependencies.

### State Management Pattern
- **URL-driven state**: All app state syncs to URL params via `hashRouter.ts`
- State initialization from URL: `parseUrlParams(window.location.search.slice(1))`
- State serialization: `serializeUrlParams()` for sharing/bookmarking
- No external state management - pure React state + URL synchronization

### Race Profile System
- Race elevation data stored in `src/assets/` as JSON arrays
- `elevation.ts` contains `RACE_PROFILES` registry and grade calculation utilities
- Elevation-aware pace adjustments using Minetti 2002 cost-of-running model
- Support for custom GPX uploads (see `src/utils/gpx.ts`)

## Component Architecture

### Core Components Structure
```
App.tsx                    # Main container with all state management
├── InputSection           # Distance/pace/time inputs with smart formatting
├── ResultCard            # Calculated results display
├── Splits                # Mile/km splits with elevation adjustments
├── PresetOptions         # Quick distance presets
└── RacePresetsSection    # Marathon elevation profiles
```

### Input Formatting Pattern
Smart time/pace input formatting is handled in `App.tsx`:
- `handlePaceInput()`: Converts "730" → "7:30", "1030" → "10:30"
- `handleGoalTimeInput()`: Formats goal times with h:mm:ss logic
- Uses `parsePaceToSeconds()` from `utils/common.ts` for validation

## Development Workflows

### Feature Development
1. **Start dev server**: `npm run dev`
2. **Test embed build**: `npm run build:embed` → check `dist-embed/embed.html`
3. **Components**: Add to `src/components/` with inline styles
4. **Utilities**: Math/calculation functions go in `src/utils/`

### Configuration Management
- Feature flags: `src/config.ts` (e.g., `hidePacingStrategy`)
- Race data: Add new profiles to `src/assets/elevationData.ts` and register in `elevation.ts`

### Build Verification
- Standard build should work in any web environment
- Embed build MUST be completely self-contained (no network requests)
- Test embed in constraint environments (like Squarespace code blocks)

## Key Integration Points

### Elevation System
- `buildSplits()` in `utils/buildSplits.ts` handles pace adjustments
- Grade calculations use actual elevation profiles from major marathons
- Two pacing strategies: "even-pace" vs "even-effort" (elevation-adjusted)

### URL State Management
- All app state persists in URL for shareability
- Critical for embed usage where users might refresh/bookmark
- State keys defined in `hashRouter.ts` AppState interface

## Common Patterns to Follow

### Adding New Race Profiles
1. Create elevation data array in `src/assets/elevationData.ts`
2. Add profile to `RACE_PROFILES` in `elevation.ts`
3. Include logo URL for UI display

### Component Development
- Always use inline styles with StyleSheet.create pattern
- Props interfaces go in `types.ts`
- Consider mobile responsiveness (embed targets mobile users)

### Math Utilities
- Time parsing/formatting: Use existing functions in `utils/common.ts`
- Unit conversions: MI_PER_KM, KM_PER_MI constants available
- Pace calculations: Work in seconds internally, display formatted

This architecture prioritizes **zero external dependencies** for the embed build while maintaining a rich feature set for pace calculation with real-world elevation profiles.