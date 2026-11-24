import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAVdg2A6e5yGnGxGg7uMaFGZ0Bw4RqY3TQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0665837098.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://gen-lang-client-0665837098-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0665837098',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0665837098.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '194258349450',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:194258349450:web:a28d66d9cf68d5ff562c73',
};

// Initialize Firebase only once
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const database: Database = getDatabase(app, firebaseConfig.databaseURL);
export const storage: FirebaseStorage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

// Convenient alias for code expecting `db`
export const db = database;
