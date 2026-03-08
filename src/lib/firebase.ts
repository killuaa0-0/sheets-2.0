import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBAtCMRmXHXAYxzAIVfMCeOvcuaNGPWlj0",
  authDomain: "sheets-version-2.firebaseapp.com",
  projectId: "sheets-version-2",
  storageBucket: "sheets-version-2.firebasestorage.app",
  messagingSenderId: "604407771318",
  appId: "1:604407771318:web:2a0308fdb4d398309ab617",
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== ''
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
}

export const googleProvider = new GoogleAuthProvider();
export { db, auth };
