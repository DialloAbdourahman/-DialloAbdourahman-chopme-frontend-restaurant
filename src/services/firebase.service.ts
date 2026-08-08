import { onRegistered, register } from "firebase/messaging";
import { getMessagingInstance } from "../lib/firebase";
import { axiosBaseClient } from "../lib/axios";
import { KEYS } from "../utils/keys";

async function registerInstallationId(installationId: string) {
  return axiosBaseClient.post("/fcm-tokens", { installationId });
}

let isRegistering = false;

async function registerForPushNotifications() {
  if (isRegistering) {
    return null;
  }

  isRegistering = true;

  if (!("Notification" in window)) {
    console.warn("Notifications are not supported in this browser");
    isRegistering = false;
    return null;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    console.warn("Notification permission not granted", permission);
    isRegistering = false;
    return null;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported");
    isRegistering = false;
    return null;
  }

  const vapidKey = KEYS.FIREBASE_VAPID_KEY?.trim();

  if (!vapidKey) {
    console.error(
      "VITE_FIREBASE_VAPID_KEY is not set. Add the Web Push certificate public key from Firebase Console.",
    );
    isRegistering = false;
    return null;
  }

  if (!/^[A-Za-z0-9_-]{40,}$/.test(vapidKey)) {
    console.error(
      "VITE_FIREBASE_VAPID_KEY is not a valid VAPID public key. Use the Web Push certificate public key, not the API key.",
    );
    isRegistering = false;
    return null;
  }

  const messaging = await getMessagingInstance();

  if (!messaging) {
    console.warn("Firebase messaging is not supported in this browser");
    isRegistering = false;
    return null;
  }

  // onRegistered fires whenever register() completes, the FID changes, or a
  // pushsubscriptionchange event occurs, so it must stay subscribed for the
  // lifetime of the app.
  onRegistered(messaging, (installationId) => {
    console.log(
      "[FirebaseService] Registered installation ID:",
      installationId,
    );
    registerInstallationId(installationId).catch((error) => {
      console.error(
        "[FirebaseService] Failed to send installation ID to backend:",
        error,
      );
    });
  });

  try {
    console.log("[FirebaseService] Registering firebase-messaging-sw.js...");
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );
    await navigator.serviceWorker.ready;
    console.log("[FirebaseService] Service worker ready:", registration);

    console.log(
      "[FirebaseService] Registering with FCM for a Firebase Installation ID...",
    );
    await register(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    console.log(
      "[FirebaseService] Registration initiated. Awaiting onRegistered callback.",
    );

    return true;
  } catch (error) {
    console.error("Failed to register for push notifications:", error);
    return null;
  } finally {
    isRegistering = false;
  }
}

export const FirebaseService = {
  registerInstallationId,
  registerForPushNotifications,
};
