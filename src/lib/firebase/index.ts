import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAem8OGmFLuLyAB0uElEvKomemcnG_t3to",
  authDomain: "presences-rfid.firebaseapp.com",
  databaseURL: "https://presences-rfid-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "presences-rfid",
  storageBucket: "presences-rfid.firebasestorage.app",
  messagingSenderId: "227293974674",
  appId: "1:227293974674:web:74385ccbf58b9bb3a2964b",
  measurementId: "G-K3FHB1YYW0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app)

export { database, auth }