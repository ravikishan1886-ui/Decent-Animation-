import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: firebaseConfigJson.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigJson.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigJson.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigJson.messagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigJson.appId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore using the configured database ID as mandated by Firebase setup.
// experimentalAutoDetectLongPolling provides resilience against stream disconnects and iframe firewall restrictions.
function initFirestore() {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfigJson.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfigJson.firestoreDatabaseId);
  }
}

export const db = initFirestore();

function initDatabase(): Database | null {
  try {
    return getDatabase(app);
  } catch (e) {
    console.warn('Realtime database init fallback notice:', e);
    return null;
  }
}

export const rtdb = initDatabase();

function initStorage(): FirebaseStorage | null {
  try {
    return getStorage(app);
  } catch (e) {
    console.warn('Firebase Storage init fallback notice:', e);
    return null;
  }
}

export const storage = initStorage();

export default app;
