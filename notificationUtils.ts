export const isMobileDevice = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const browserNotificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!browserNotificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export async function showBrowserNotification(title: string, body: string) {
  if (!browserNotificationsSupported() || Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `star-comunity-${Date.now()}`
    });
  } catch (error) {
    console.warn('Notification navigateur indisponible', error);
  }
}
