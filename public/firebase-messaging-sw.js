importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyA9JYNjAwWMxn4hyF_lpLhUrofPIkGCtuI",
  authDomain: "chopme-dev.firebaseapp.com",
  projectId: "chopme-dev",
  storageBucket: "chopme-dev.firebasestorage.app",
  messagingSenderId: "270649373018",
  appId: "1:270649373018:web:9e0880370c37b29e16c363",
  measurementId: "G-345KMJ810P",
});

const messaging = firebase.messaging();

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

messaging.onBackgroundMessage((payload) => {
  console.log("Background message received: ", payload);

  const notificationTitle = payload.notification?.title || "New Update!";
  const notificationOptions = {
    body: payload.notification?.body || "Check your app for details.",
    // icon: "/logo.png", // Must be a path in your public folder
    // badge: "/badge.png", // Small icon shown in Android status bars
    data: {
      url: payload.data?.click_action || "/", // Store a redirect URL if needed
    },
  };

  // Instruct the browser to show the physical OS banner
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
