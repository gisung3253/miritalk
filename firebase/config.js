import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration  
const firebaseConfig = {
  apiKey: "AIzaSyA_JJJq1IumoKEvcbMWE83PYXglPmf93no",
  authDomain: "calender-1676d.firebaseapp.com",
  projectId: "calender-1676d",
  storageBucket: "calender-1676d.firebasestorage.app",
  messagingSenderId: "822375301207",
  appId: "1:822375301207:web:a93fcab8443a1f3e57e312"
};

// 파이어베이스 초기화
const app = initializeApp(firebaseConfig);

// 파이어베이스 인증 초기화
const auth = getAuth(app);

// AsyncStorage 설정
auth.setPersistence(getReactNativePersistence(ReactNativeAsyncStorage));

export { app, auth };