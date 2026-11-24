import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

const DEFAULT_RTDB_URL = 'https://gen-lang-client-0665837098-default-rtdb.firebaseio.com';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || DEFAULT_RTDB_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
};

// Single canonical Firebase App instance for the entire web application
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const database: Database = getDatabase(app, firebaseConfig.databaseURL);
export const storage: FirebaseStorage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

// Alias for modules expecting `db`
export const db = database;
