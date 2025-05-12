// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDrAPxqX_bxAx7Q-JDf3gc2-TMRoBNtC2g",
  authDomain: "ant-426ba.firebaseapp.com",
  projectId: "ant-426ba",
  storageBucket: "ant-426ba.firebasestorage.app",
  messagingSenderId: "510558860069",
  appId: "1:510558860069:web:348d815e0ce59f5d6520cc"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);