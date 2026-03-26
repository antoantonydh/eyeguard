# Face Presence Handling — Design Specification

**Date:** 2026-03-26
**Status:** Approved
**Parent:** EyeGuard

## Problem

When MediaPipe detects no face (user walks away, covers camera, looks away too far), EyeGuard currently:
- Keeps the blink rolling window decaying → blink rate drops to 0
- Keeps `secondsSinceLastBlink` climbing → triggers false stare alerts
- Keeps low-blink-duration timer ticking → triggers false blink reminders
- Keeps session screen time accumulating → inaccurate daily stats
- Shows no UI indication that face is missing

## Solution

Add a `facePresence` state machine to `useDetection` with a 3-second grace period. When face is absent, freeze all counters, suppress all alerts, pause session time, and show a clear UI indicator.

## Face Presence State Machine

```
States: present | grace | absent

Transitions:
  present → grace    : when processFrame returns null (no face detected)
  grace   → absent   : when no face for 3 continuous seconds
  grace   → present  : when face detected again (immediate)
  absent  → present  : when face detected again (immediate)
```

**Grace period: 3 seconds.** Handles brief glances away, head turns, and momentary detection drops without UI flickering.

## Changes by Layer

### Detection Layer (`useDetection`)

Add to `DetectionState`:
- `facePresence: 'present' | 'grace' | 'absent'`

Track in `processFrame` loop:
- When `result` is `null`: increment `noFaceFrameCount`. If accumulated time exceeds 3s → set `facePresence` to `grace`, then `absent`.
- When `result` is non-null: reset `noFaceFrameCount`, set `facePresence` to `present`.

**When `facePresence === 'absent'`:**
- Do NOT call `detector.processEAR()` — freeze blink rate and stare timer
- Reset `lowBlinkDurationSeconds` to 0 (no false blink alerts)
- Do NOT increment `stareAlerts`

**When transitioning `absent → present`:**
- Call `detector.reset()` — clears the rolling blink window (old data is stale)
- Reset `secondsSinceLastBlink` to 0

### Alert System (`alert-manager`)

Add early return to `determineAlert`:
- If `facePresence !== 'present'` → return `null`

No alerts fire during `grace` or `absent` states.

### Break Timer

**When `absent → present`:**
- Reset the break timer to its full interval (user preference from brainstorming)
- Rationale: being away from the screen is itself a break; restarting the countdown gives fresh screen-time tracking

Implemented by: `useAlerts` exposes a `resetBreakTimer()` function. `useEyeGuard` calls it when face transitions from absent to present.

### Session Tracking (`useEyeGuard`)

- Track `awaySeconds`: accumulated time in `absent` state during the session
- Subtract `awaySeconds` from total session time when computing `totalScreenTime`
- Do NOT record blink events while `facePresence !== 'present'`
- Chart data: skip data points while absent (gap in chart is informative)
- Timeline: add `'away'` as a new segment type (displayed in gray)

### UI Changes

**StatusBanner:**
- When `facePresence === 'absent'`:
  - Gray theme (#475569 background, #94a3b8 text)
  - Title: "Face not detected"
  - Subtitle: "Tracking paused — come back to resume"
- When `facePresence === 'grace'`:
  - Current theme maintained (no flicker during brief losses)

**CameraStatusBar:**
- Show face presence alongside camera status:
  - `present`: green dot + "Active"
  - `grace`: yellow dot + "Detecting..."
  - `absent`: gray dot + "No face — paused"

**DebugPanel:**
- Show `facePresence` state in the overlay stats

**Overlay notifications:**
- No overlays render when `facePresence !== 'present'`

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/use-detection.ts` | Add facePresence state machine to processFrame loop |
| `src/alerts/alert-manager.ts` | Add facePresence check, early return null when not present |
| `src/hooks/use-alerts.ts` | Pass facePresence to determineAlert, add resetBreakTimer |
| `src/hooks/use-eye-guard.ts` | Track awaySeconds, skip blink events while absent, handle absent→present transition (reset break timer) |
| `src/components/dashboard/StatusBanner.tsx` | Add absent state UI (gray theme) |
| `src/components/dashboard/CameraStatusBar.tsx` | Show face presence indicator |
| `src/components/dashboard/DebugPanel.tsx` | Show facePresence in overlay |
| `src/components/dashboard/SessionTimeline.tsx` | Support 'away' segment type (gray) |
| `src/components/dashboard/DashboardPage.tsx` | Pass facePresence prop through |
| `src/components/overlays/OverlayManager.tsx` | Suppress overlays when not present |
| `src/types/index.ts` | Export FacePresence type |
| `tests/alerts/alert-manager.test.ts` | Add tests for facePresence filtering |
| `tests/detection/` | Add tests for presence state transitions |

## Non-Goals

- Camera hardware failure detection (separate concern)
- Multiple face handling (spec says numFaces: 1)
- Partial face detection (e.g., only one eye visible)
