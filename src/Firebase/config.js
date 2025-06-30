// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQkLSLQXwUlnWULZY3djGfer6tTPEYCSo",
  authDomain: "palliative-web.firebaseapp.com",
  projectId: "palliative-web",
  storageBucket: "palliative-web.firebasestorage.app",
  messagingSenderId: "271871285310",
  appId: "1:271871285310:web:9fc191edb1d9763719d96f",
  measurementId: "G-FGHDCH3NZX"
};

const FirebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(FirebaseApp);
