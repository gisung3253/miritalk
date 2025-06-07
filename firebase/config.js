import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA_JJJq1IumoKEvcbMWE83PYXglPmf93no",
  authDomain: "calender-1676d.firebaseapp.com",
  projectId: "calender-1676d",
  storageBucket: "calender-1676d.firebasestorage.app",
  messagingSenderId: "822375301207",
  appId: "1:822375301207:web:a93fcab8443a1f3e57e312"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화 (기존 방식 유지)
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

