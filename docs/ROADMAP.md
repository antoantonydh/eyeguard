# EyeGuard — Roadmap & Future Ideas

Ideas captured from development sessions. Not prioritised — revisit when planning the next phase.

---

## 🔴 High Impact

### Tauri Desktop Wrapper
Package EyeGuard as a native desktop app. System tray icon, runs always in the background, native OS notifications without needing a browser window open. Real fix for the tab-switching/minimise problem.

### Partial Blink Detection
Many dry eye cases come from *incomplete* blinks (eyes don't fully close rather than zero blinks). MediaPipe provides enough landmarks to measure blink completeness. Alert when too many blinks are shallow.

### Personalised Insights
After a week of data, surface patterns:
- "You blink 40% less between 2–4pm"
- "Your breaks are most skipped on Mondays"
- "Your blink rate improved 20% this week"

---

## 🟡 UX / Polish

### Onboarding Tips
After calibration, a 30-second walkthrough explaining what each alert means and what the user should actually do when one fires.

### Weekly Summary Card
A shareable PNG card (or in-app view) showing the week's eye health stats — score trend, total breaks taken, average blink rate. Could be used for personal tracking or sharing.

### Dark / Light Theme
Currently dark-only. A light theme would be useful for bright environments and users who prefer it.

### Recalibration Prompt
If the user puts glasses on mid-session, detection confidence drops noticeably. Detect the drop and prompt the user to recalibrate rather than silently degrading.

---

## 🟢 Data & Accuracy

### Gaze Direction Tracking
Confirm the user actually looked away during a 20-20-20 break (MediaPipe provides iris landmarks for gaze estimation). Currently the break is marked as "taken" on a timer regardless.

### Export Data as CSV
Let users download their blink events, sessions, and daily stats as a CSV file for external analysis or backup.

### Cross-Device Sync
Optional — sync daily stats across devices via a simple backend or iCloud/Google Drive. Currently everything is local IndexedDB only.

---

## 🔵 Platform

### Mobile App
iOS/Android version. Camera access works on mobile browsers but PWA camera support is limited. A native app would solve this.

### Browser Extension
Run as a Chrome/Safari extension instead of a tab or PWA. Extensions have more background lifecycle options and can overlay alerts on any page.

---

*Last updated: 2026-03-26*
