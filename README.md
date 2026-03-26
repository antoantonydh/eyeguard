# 👁 EyeGuard

A web app that monitors your blink rate via webcam and helps prevent dry eyes and eye fatigue. All processing happens on your device — no data is sent anywhere.

## Features

- **Real-time blink detection** using MediaPipe Face Mesh (runs locally in your browser via WebGL)
- **20-20-20 rule reminders** — every 20 minutes, look 20 feet away for 20 seconds
- **Stare alerts** — notified when you haven't blinked for 10+ seconds
- **Low blink rate alerts** — after 30+ seconds below your threshold
- **Glasses support** — personal calibration adjusts to your eyes (with or without glasses)
- **Face presence detection** — tracking pauses automatically when you walk away and resumes when you return
- **Dashboard** with live blink rate chart, daily score, session timeline, and break tracking
- **Persistent data** — chart, breaks, blink count, and score survive page reloads (stored in IndexedDB)
- **Sound alerts** — distinct sounds for blink, break, and stare events (configurable)

## Tech Stack

- React 18 + TypeScript + Vite
- [MediaPipe Face Mesh](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) — eye landmark detection
- [Dexie.js](https://dexie.org) — IndexedDB wrapper for local data storage
- Web Audio API — in-browser sound generation (no audio files)
- Vitest + React Testing Library

## Getting Started

```bash
# Install dependencies
yarn

# Start dev server
yarn dev

# Run tests
npx vitest run

# Build for production
yarn build
```

Open http://localhost:5173 and complete the one-time calibration (10 seconds).

## How It Works

### Eye Tracking

MediaPipe Face Mesh detects 478 face landmarks at up to 24 FPS. The app measures the **Eye Aspect Ratio (EAR)** from 6 landmarks around each eye:

```
EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
```

When EAR drops below your calibrated threshold → blink detected. Blink rate is tracked as a rolling 60-second average.

### Calibration

On first launch, you blink naturally for 10 seconds. The app calculates your personal baseline EAR (everyone's eyes are shaped differently, and glasses affect the measurement). This threshold is stored locally and used for all future sessions.

### Face Presence

If no face is detected for 3+ seconds:
- All counters freeze (blink rate, stare timer)
- All alerts are suppressed
- Session time stops accumulating
- Dashboard shows "Face not detected — tracking paused"
- Break timer resets to full interval when you return

### Data Storage

Everything is stored locally in IndexedDB — no accounts, no backend, no network requests after the initial MediaPipe model download.

| Table | Contents |
|-------|----------|
| `sessions` | Per-session stats (blink rate, breaks, score) |
| `blink_events` | Individual blink timestamps (kept 7 days) |
| `daily_stats` | Aggregated daily totals |
| `userProfile` | Calibration data and settings |

### Daily Score

```
score = (breaksTaken / breaksOffered × 40)
      + (blinkRate ≥ threshold ? 40 : blinkRate / threshold × 40)
      + (stareAlerts < 5 ? 20 : max(0, 20 − stareAlerts))
```

## Settings

All defaults are based on published eye health research:

| Setting | Default | Reasoning |
|---------|---------|-----------|
| Break interval | 20 min | AOA/AAO 20-20-20 rule consensus |
| Break duration | 60 sec | 20s shown ineffective (Rosenfield 2023) |
| Blink threshold | 12/min | Healthy avg ~14/min; screen use drops to 4-6/min |
| Stare delay | 10 sec | Normal interblink ~6s; tear film breaks at ~10s |
| Camera FPS | 24 | Fast blinks (~100ms) need 3+ frames for reliable detection |
| Sound alerts | On | Silent health notifications are frequently ignored |
| Chart interval | 60 sec | One bar per minute for clear per-minute blink pattern |

## Project Structure

```
src/
├── alerts/          # Alert logic (alert-manager, break-timer)
├── components/
│   ├── dashboard/   # Dashboard panels (chart, score, timeline, debug)
│   ├── layout/      # TopNav, AppLayout
│   ├── onboarding/  # 5-step calibration wizard
│   ├── overlays/    # Blink, break, and stare notifications
│   └── settings/    # Settings page
├── db/              # Dexie.js database schema
├── detection/       # MediaPipe integration, EAR calculator, blink detector, calibrator
├── hooks/           # useCamera, useDetection, useAlerts, useSettings, useEyeGuard
├── storage/         # Repository pattern for IndexedDB tables
├── types/           # Shared TypeScript interfaces
└── utils/           # Format helpers, Web Audio sound generation
```

## Privacy

- Video never leaves your device — MediaPipe runs entirely in the browser
- No video frames are stored or recorded
- All data is in your browser's IndexedDB (origin-isolated)
- No analytics, no telemetry, no accounts

## Research Sources

- [AOA Digital Eye Strain Guidelines](https://www.aao.org/eye-health/tips-prevention/computer-usage)
- [Rosenfield et al. — 20-20-20 rule effectiveness](https://pubmed.ncbi.nlm.nih.gov/35963776/)
- [Blink rate and tear film stability](https://www.nature.com/articles/s41598-025-26424-z)
- [Maximum blink interval and dry eye](https://www.nature.com/articles/s41598-018-31814-7)
