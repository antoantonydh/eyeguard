export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

interface EyeGuardNotification {
  title: string
  body: string
  tag: string
}

export function sendNativeNotification({ title, body, tag }: EyeGuardNotification): void {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (document.visibilityState !== 'hidden') return // only when app is in background

  new Notification(title, {
    body,
    icon: '/eyeguard/icon.svg',
    tag,
    requireInteraction: false,
  })
}
