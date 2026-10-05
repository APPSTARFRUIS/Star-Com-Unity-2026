import { supabase } from './supabaseClient';

export const isMobileDevice = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const browserNotificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
};

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!browserNotificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export async function registerPushSubscription(userId: string) {
  if (!supabase) throw new Error('Supabase indisponible.');
  const permission = await requestBrowserNotificationPermission();
  if (permission !== 'granted') throw new Error(permission === 'unsupported' ? 'Notifications push non disponibles sur cet appareil.' : 'Autorisation de notifications refusée.');
  const vapidPublicKey = (import.meta as any).env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) throw new Error('Clé VAPID publique manquante dans Vercel.');
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
  }
  const json = subscription.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString()
  }, { onConflict: 'endpoint' });
  if (error) throw error;
  return subscription;
}

export async function showBrowserNotification(title: string, body: string) {
  if (!browserNotificationsSupported() || Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: `star-comunity-${Date.now()}` });
  } catch (error) { console.warn('Notification navigateur indisponible', error); }
}
