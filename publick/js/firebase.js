import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdZkTVOW_TrOiKtsYwojUI5GHHVh_ZMwk",
  authDomain: "mineplix-3d91c.firebaseapp.com",
  databaseURL: "https://mineplix-3d91c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mineplix-3d91c",
  storageBucket: "mineplix-3d91c.firebasestorage.app",
  messagingSenderId: "932702850146",
  appId: "1:932702850146:web:0933bde133e94b4254953b",
  measurementId: "G-VTMMJV3HY7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app);

export { 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
};