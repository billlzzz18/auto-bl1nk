import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// JSDoc: อุปกรณ์จัดการ Firebase Initializer และผู้ให้บริการ GoogleAuthProvider
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// ผูก Firestore Database ID ตามที่ได้รับมอบหมาย
export const db = getFirestore(app, 'ai-studio-11ccc134-e691-4d40-b733-e4abb6420dae');

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/documents');
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/chat.spaces.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/chat.messages.create');
googleProvider.addScope('https://www.googleapis.com/auth/tasks');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/keep');
googleProvider.addScope('https://www.googleapis.com/auth/slides');

let cachedAccessToken: string | null = null;

/**
 * Cache access token
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      window.sessionStorage.setItem('bl1nk_google_token', token);
    } else {
      window.sessionStorage.removeItem('bl1nk_google_token');
    }
  }
};

/**
 * Retrieve cached token
 */
export const getCachedAccessToken = (): string | null => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = window.sessionStorage.getItem('bl1nk_google_token');
  }
  return cachedAccessToken;
};
