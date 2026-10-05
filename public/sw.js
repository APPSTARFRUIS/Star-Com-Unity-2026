self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Star Com’Unity', {
    body: data.body || 'Vous avez une nouvelle notification.',
    icon: '/icon-192.png', badge: '/icon-192.png', data: { url: data.url || '/' }, tag: data.tag || 'star-comunity-push'
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    if (list.length) { list[0].navigate(url); return list[0].focus(); }
    return clients.openWindow(url);
  }));
});
