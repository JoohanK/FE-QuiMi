import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native"; // Import Platform

const firebaseConfig = {
  apiKey: "AIzaSyBC4IwuvLahLKq97EBFFbaclQGoh1HhF3c",
  authDomain: "quimi-c6458.firebaseapp.com",
  projectId: "quimi-c6458",
  storageBucket: "quimi-c6458.firebasestorage.app",
  messagingSenderId: "225607921317",
  appId: "1:225607921317:web:6c3f638a3e0b781d6c674c",
  measurementId: "G-R8RVV6TD46",
};

export const app = initializeApp(firebaseConfig);

export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export const db = getFirestore(app);
