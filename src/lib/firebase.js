import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAvT8UDXQRuroFb_4y9el2v3klQtQ1DjIE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "codeable-project-manager.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "codeable-project-manager",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "codeable-project-manager.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "121480200753",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:121480200753:web:fb9cd43bc800255999cb10",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-CVPMV1S2SW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firebase Hosting URL (for future reference)
export const hostingUrl = 'https://codeable-project-manager-1bfdc.web.app';

export default app;
