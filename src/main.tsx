import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Capture beforeinstallprompt as early as possible — it fires before React mounts
// so component-level event listeners often miss it. Stored globally for TopNav to read.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).__pwaInstallPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__pwaInstallPrompt = e
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
