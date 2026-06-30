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

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em background:', payload);
  const notificationTitle = payload.notification?.title || 'Nova Requisição';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova notificação.',
    icon: '/requisicao-elton/icons/icon-192.png',
    badge: '/requisicao-elton/icons/icon-192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
