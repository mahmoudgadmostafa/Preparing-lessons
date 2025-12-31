import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBefj7Oddil_MkHjW3BZFnlZyu0kO8AQjw",
  authDomain: "learning-550cc.firebaseapp.com",
  projectId: "learning-550cc",
  storageBucket: "learning-550cc.firebasestorage.app",
  messagingSenderId: "323754363842",
  appId: "1:323754363842:web:50de9833d0f12676a6a45b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
