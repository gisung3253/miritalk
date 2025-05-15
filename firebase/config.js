import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { app, auth };