import { initializeApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: "AIzaSyA9JYNjAwWMxn4hyF_lpLhUrofPIkGCtuI",
  authDomain: "chopme-dev.firebaseapp.com",
  projectId: "chopme-dev",
  storageBucket: "chopme-dev.firebasestorage.app",
  messagingSenderId: "270649373018",
  appId: "1:270649373018:web:9e0880370c37b29e16c363",
  measurementId: "G-345KMJ810P",
};

export const firebaseApp = initializeApp(firebaseConfig);

let messaging: Messaging | undefined;

export async function getMessagingInstance(): Promise<Messaging | undefined> {
  if (messaging) {
    return messaging;
  }

  if (await isSupported()) {
    messaging = getMessaging(firebaseApp);
  }

  return messaging;
}
