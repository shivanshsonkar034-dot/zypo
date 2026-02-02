/* ======================================
   ZYPSO MART – FIXED firebase.js
   ====================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

/* ======================================
   FIREBASE CONFIG
   ====================================== */
const firebaseConfig = {
  apiKey: "AIzaSyDxztzPoCTCzckaEsvupHJOyCHEhAxr9DU",
  authDomain: "zypso-mart-cd989.firebaseapp.com",
  projectId: "zypso-mart-cd989",
  storageBucket: "zypso-mart-cd989.appspot.com", // ✅ FIXED
  messagingSenderId: "91046649188",
  appId: "1:91046649188:web:0472d26bc617a5396f2e71"
};

/* ======================================
   INIT APP
   ====================================== */
const app = initializeApp(firebaseConfig);

/* ======================================
   EXPORT SERVICES
   ====================================== */
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/* ======================================
   ANALYTICS – SAFE LOAD (PRODUCTION ONLY)
   ====================================== */
if (
  typeof window !== "undefined" &&
  location.hostname !== "localhost" &&
  location.protocol === "https:"
) {
  import("https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js")
    .then(({ getAnalytics }) => {
      getAnalytics(app);
    })
    .catch(() => {
      // silently ignore analytics failure
    });
}
