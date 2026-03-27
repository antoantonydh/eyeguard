import { useState, useEffect, useCallback } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PwaState {
  canInstall: boolean
  isInstalled: boolean
  updateAvailable: boolean
  install: () => Promise<void>
  applyUpdate: () => void
}

// Capture beforeinstallprompt as early as possible.
// This is called once when the module first loads — before any component mounts.
let _capturedPrompt: BeforeInstallPromptEvent | null = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  _capturedPrompt = e as BeforeInstallPromptEvent
})

export function usePwa(): PwaState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => _capturedPrompt
  )
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches
  )

  // SW update detection via vite-plugin-pwa
  const { needRefresh: [updateAvailable], updateServiceWorker } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      if (r) setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  useEffect(() => {
    if (isInstalled) return

    // Pick up any prompt captured before this hook mounted
    if (_capturedPrompt && !installPrompt) {
      setInstallPrompt(_capturedPrompt)
    }

    const onPrompt = (e: Event) => {
      const prompt = e as BeforeInstallPromptEvent
      _capturedPrompt = prompt
      setInstallPrompt(prompt)
    }
    const onInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      _capturedPrompt = null
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [isInstalled, installPrompt])

  const install = useCallback(async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setInstallPrompt(null)
      _capturedPrompt = null
    }
  }, [installPrompt])

  const applyUpdate = useCallback(() => {
    updateServiceWorker(true)
  }, [updateServiceWorker])

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    updateAvailable,
    install,
    applyUpdate,
  }
}
