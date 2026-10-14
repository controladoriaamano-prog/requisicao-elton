importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBQ70lgKcnXly1a940m5W71MRnjDd57pTE",
  authDomain: "requisicao-elton.firebaseapp.com",
  databaseURL: "https://requisicao-elton-default-rtdb.firebaseio.com",
  projectId: "requisicao-elton",
  storageBucket: "requisicao-elton.firebasestorage.app",
  messagingSenderId: "422961429320",
  appId: "1:422961429320:web:e535673592e1efbdc2917d"
});

const messaging = firebase.messaging();

// Notificação recebida com o app FECHADO ou em segundo plano
messaging.onBackgroundMessage(function (payload) {
  const d = payload.data || {};
  const n = payload.notification || {};
  const title = n.title || d.titulo || 'Requisição Elton';
  const body = n.body || d.corpo || 'Você tem uma nova notificação.';
  const tag = d.tag || ('reqelton-' + Date.now());
  return self.registration.showNotification(title, {
    body: body,
    icon: '/requisicao-elton/icons/icon-192.png',
    badge: '/requisicao-elton/icons/icon-192.png',
    tag: tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [400, 150, 400, 150, 700],
    data: { url: d.url || '/requisicao-elton/' }
  });
});

// Ao tocar na notificação, abre/foca o app
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/requisicao-elton/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (c.url.indexOf('requisicao-elton') !== -1 && 'focus' in c) {
          try { c.navigate(url); } catch (err) {}
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
