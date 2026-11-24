// Canonical Firebase exports live in ./firebase/firebase (Realtime Database + Authentication).
// Re-export here so all imports use the single initialized Firebase App, Auth, and Database instance.
export { app, auth, database, db, storage, firebaseConfig } from './firebase/firebase';
