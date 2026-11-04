import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

export const firebaseConfig = {
  apiKey: 'AIzaSyCOk_yef2gRBCdm8FwEgeidK7TrK1Yvcd0',
  authDomain: 'inter-level-progress-manager.firebaseapp.com',
  projectId: 'inter-level-progress-manager',
  storageBucket: 'inter-level-progress-manager.firebasestorage.app',
  messagingSenderId: '379503088311',
  appId: '1:379503088311:web:ff8ed9b3c2540b9b133332',
  measurementId: 'G-6EMDPK976J',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Quiz drafts contain optional fields (for example eventDate and institution).
// Firestore rejects `undefined` by default, so omit those optional values while
// preserving the rest of the document instead of failing the entire save.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const functions = getFunctions(app);

if (typeof window !== 'undefined') {
  void isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_WEB_APP_ID = firebaseConfig.appId;
export const APP_KEY = 'quizProjectionApp2';
