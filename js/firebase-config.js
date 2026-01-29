// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAAsnLJEUjGTbN-ZQzu09hMZwafM-f7vxU",
    authDomain: "col-evt-mgr-2026.firebaseapp.com",
    projectId: "col-evt-mgr-2026",
    storageBucket: "col-evt-mgr-2026.firebasestorage.app",
    messagingSenderId: "582527348255",
    appId: "1:582527348255:web:9859d760e46397942daf2a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
