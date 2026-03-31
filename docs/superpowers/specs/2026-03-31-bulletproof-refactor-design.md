# Bulletproof-React Architecture Refactor

**Date:** 2026-03-31
**Status:** Approved
**Scope:** Full big-bang restructure of `src/` to align with bulletproof-react conventions

---

## Motivation

Proactive hygiene before the codebase grows further. Establishing a clean, navigable architecture that scales — with enforced import boundaries and clear ownership of every file.

---

## Target Directory Structure

```
src/
├── app/
│   ├── App.tsx              ← thin composer: mounts providers, bridges settings, renders router
│   └── router.tsx           ← route definitions
├── components/
│   └── layout/
│       ├── AppLayout.tsx
│       └── TopNav.tsx
├── config/
│   └── defaults.ts          ← DEFAULT_SETTINGS (moved from types/)
├── features/
│   ├── dashboard/
│   │   └── components/
│   │       ├── BlinkRateChart.tsx
│   │       ├── CameraStatusBar.tsx
│   │       ├── DailyScore.tsx
│   │       ├── DashboardPage.tsx
│   │       ├── DebugPanel.tsx
│   │       └── SessionTimeline.tsx
│   ├── history/
│   │   └── components/
│   │       └── HistoryPage.tsx
│   ├── onboarding/
│   │   └── components/
│   │       ├── CalibrationStep.tsx
│   │       ├── CameraPermissionStep.tsx
│   │       ├── GlassesCheckStep.tsx
│   │       ├── OnboardingFlow.tsx
│   │       ├── ReadyStep.tsx
│   │       └── WelcomeStep.tsx
│   ├── overlays/
│   │   └── components/
│   │       ├── BlinkReminder.tsx
│   │       ├── BreakOverlay.tsx
│   │       ├── OverlayManager.tsx
│   │       └── StareAlert.tsx
│   └── settings/
│       └── components/
│           └── SettingsPage.tsx
├── hooks/
│   ├── use-alerts.ts        ← thin useContext(AlertsContext) consumer
│   ├── use-detection.ts     ← thin useContext(DetectionContext) consumer
│   ├── use-pwa.ts
│   └── use-settings.ts      ← reads storage, used by features + app/
├── providers/
│   ├── AlertsProvider.tsx   ← absorbs use-alerts logic + break-timer + alert-manager
│   ├── alert-manager.ts     ← co-located (only AlertsProvider uses it)
│   ├── break-timer.ts       ← co-located (only AlertsProvider uses it)
│   ├── DetectionProvider.tsx← absorbs use-detection logic + use-camera
│   ├── use-camera.ts        ← co-located (only DetectionProvider uses it)
│   ├── face-tracker.ts      ← co-located (only DetectionProvider uses it)
│   ├── ear-calculator.ts    ← co-located (only DetectionProvider uses it)
│   ├── blink-detector.ts    ← co-located (only DetectionProvider uses it)
│   ├── calibrator.ts        ← co-located (only DetectionProvider uses it)
│   └── PwaProvider.tsx      ← extracted from context/PwaContext.tsx
├── storage/
│   ├── database.ts
│   ├── blink-event-repository.ts
│   ├── daily-stats-repository.ts
│   ├── session-repository.ts
│   └── user-profile-repository.ts
├── types/
│   └── index.ts             ← types only (DEFAULT_SETTINGS removed)
└── utils/
    ├── format.ts
    ├── notifications.ts
    ├── score-calculator.ts  ← moved from storage/ (pure math, no DB access)
    └── sounds.ts
```

---

## Provider Composition (app/App.tsx)

Providers are always mounted — tracking and alerts run regardless of which route is active. `app/` is the only layer that imports from multiple features and providers simultaneously.

```tsx
// app/App.tsx

// Layer 1: reads settings from storage, mounts DetectionProvider
function AppWithSettings() {
  const { settings, profile } = useSettings()
  return (
    <DetectionProvider settings={settings} baselineEAR={profile?.baselineEAR ?? 0}>
      <AppWithAlerts settings={settings} />
    </DetectionProvider>
  )
}

// Layer 2: inside DetectionProvider, reads detection state, bridges to AlertsProvider
function AppWithAlerts({ settings }: { settings: Settings }) {
  const detection = useDetection()  // ← valid: we're inside DetectionProvider
  return (
    <AlertsProvider settings={settings} detection={detection}>
      <Router>
        <AppLayout>
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/onboarding" element={<OnboardingFlow />} />
          </Routes>
        </AppLayout>
      </Router>
      <OverlayManager />
    </AlertsProvider>
  )
}

export function App() {
  return (
    <PwaProvider>
      <AppWithSettings />
    </PwaProvider>
  )
}
```

**Why two bridge components:** `AlertsProvider` needs both settings and detection state. But it can't call `useDetection()` internally (that would require `providers/` importing from `hooks/`, inverting the flow). Instead, `app/` uses a two-layer bridge: `AppWithSettings` reads settings and mounts `DetectionProvider`; `AppWithAlerts` sits inside `DetectionProvider` so it can legally call `useDetection()` and pass detection state down as props to `AlertsProvider`. Providers stay import-clean.

**`OverlayManager` is mounted outside `<Routes>`** so overlays appear regardless of active route.

---

## Provider Internals

### DetectionProvider

Absorbs the logic currently spread across `use-detection.ts`, `use-camera.ts`, and `detection/`:

- Manages camera lifecycle (`use-camera` logic)
- Runs the MediaPipe face tracking loop (`face-tracker.ts`)
- Computes EAR and blink detection (`ear-calculator.ts`, `blink-detector.ts`)
- Handles calibration baseline (`calibrator.ts`)
- Exposes `DetectionContext` with: `blinkRate`, `isStaring`, `facePresence`, `confidence`, `isTracking`, `totalBlinks`, `stareAlerts`, `secondsSinceLastBlink`, `lowBlinkDurationSeconds`, camera controls

All co-located files (face-tracker, ear-calculator, blink-detector, calibrator, camera logic) live inside `providers/` — they have no other consumers.

### AlertsProvider

Absorbs the logic from `use-alerts.ts`, `alert-manager.ts`, and `break-timer.ts`:

- Manages break timer (restore from localStorage, countdown)
- Computes active alert from detection state
- Sends native notifications
- Exposes `AlertsContext` with: `alert`, `startBreak`, `skipBreak`, `resetBreakTimer`, `minutesUntilBreak`, `breaksOffered`, `breaksTaken`, `isBreakActive`

Receives detection state as props from `app/App.tsx` (via `AppWithAlerts`) — no cross-provider imports.

---

## Import Rules

| Layer | Can import from |
|-------|----------------|
| `config/`, `types/`, `utils/` | Each other only |
| `storage/` | `config/`, `types/`, `utils/` |
| `providers/` | `storage/`, `config/`, `types/`, `utils/` |
| `hooks/` | `providers/` (for context objects), `storage/`, `config/`, `types/`, `utils/` |
| `components/` | `hooks/`, `config/`, `types/`, `utils/` |
| `features/` | `hooks/`, `components/`, `storage/`, `config/`, `types/`, `utils/` |
| `app/` | Everything |

**Forbidden:** `features/A` importing from `features/B`. Features communicate exclusively through contexts consumed via `hooks/`.

ESLint `import/no-restricted-paths` rules should enforce the forbidden cross-feature boundary.

---

## Key Migrations

| From | To | Reason |
|------|----|--------|
| `hooks/use-detection.ts` (logic) | `providers/DetectionProvider.tsx` | It's provider logic, not a consumer hook |
| `hooks/use-alerts.ts` (logic) | `providers/AlertsProvider.tsx` | Same |
| `hooks/use-camera.ts` | Inside `providers/` | Only DetectionProvider uses it |
| `alerts/alert-manager.ts` | Inside `providers/` | Only AlertsProvider uses it |
| `alerts/break-timer.ts` | Inside `providers/` | Only AlertsProvider uses it |
| `detection/*` | Inside `providers/` | Only DetectionProvider uses them |
| `storage/score-calculator.ts` | `utils/score-calculator.ts` | Pure function, no DB access |
| `types/DEFAULT_SETTINGS` | `config/defaults.ts` | Config value, not a type |
| `context/PwaContext.tsx` | `providers/PwaProvider.tsx` | Consistent with provider pattern |
| New `hooks/use-detection.ts` | `useContext(DetectionContext)` | Thin consumer hook for features |
| New `hooks/use-alerts.ts` | `useContext(AlertsContext)` | Thin consumer hook for features |

---

## What Each Feature Imports

| Feature | Imports from |
|---------|-------------|
| `dashboard/` | `hooks/use-detection`, `hooks/use-alerts`, `hooks/use-settings`, `storage/` |
| `history/` | `storage/` |
| `onboarding/` | `hooks/use-detection`, `hooks/use-settings`, `storage/` |
| `overlays/` | `hooks/use-alerts` |
| `settings/` | `hooks/use-settings`, `hooks/use-detection` (camera controls) |

---

## Out of Scope

- No logic changes — this is a pure structural refactor
- No new features
- Test file locations follow their source files (same feature/folder)
- `tests/` root folder structure mirrors `src/` structure post-refactor
