import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Wraps vite-plugin-pwa's useRegisterSW to expose a simple update API.
 * When a new version is deployed, updateAvailable becomes true.
 * Call applyUpdate() to reload to the new version.
 */
export function usePwaUpdate() {
  const { needRefresh: [updateAvailable], updateServiceWorker } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      // Check for updates every hour
      if (r) setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  return {
    updateAvailable,
    applyUpdate: () => updateServiceWorker(true),
  }
}
