import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyDUr8prqFzOeH_06420Ihnnlx9hs-LxdgQ",
  authDomain: "velora-eb310.firebaseapp.com",
  projectId: "velora-eb310",
  storageBucket: "velora-eb310.firebasestorage.app",
  messagingSenderId: "348581523476",
  appId: "1:348581523476:web:5d9454a7c373d5f88ab701"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export {
    app,
    auth,
    db
};
