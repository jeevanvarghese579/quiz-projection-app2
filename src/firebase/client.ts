import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
export const db = getFirestore(app);
export const functions = getFunctions(app);
const invigilatorApp = getApps().some((item) => item.name === 'invigilator-session')
  ? getApp('invigilator-session')
  : initializeApp(firebaseConfig, 'invigilator-session');
export const invigilatorAuth = getAuth(invigilatorApp);
export const invigilatorFunctions = getFunctions(invigilatorApp);

if (typeof window !== 'undefined') {
  void isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_WEB_APP_ID = firebaseConfig.appId;
export const APP_KEY = 'quizProjectionApp2';
