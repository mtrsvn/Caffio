// firebaseconfig.js
import { getApps, initializeApp } from "firebase/app";
import {
    createUserWithEmailAndPassword,
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

// Your web app's Firebase configuration (keep this file out of app/ routes folder)
const firebaseConfig = {
  apiKey: "AIzaSyBBn03Xi_UWe0Ca8sTvSMOoViHwttcHwA0",
  authDomain: "caffio-291e7.firebaseapp.com",
  projectId: "caffio-291e7",
  storageBucket: "caffio-291e7.appspot.com",
  messagingSenderId: "137243555767",
  appId: "1:137243555767:web:3cb68cc1f4d6696f0a5a32",
  measurementId: "G-5K4VKJ8SV7",
};

// Initialize Firebase only once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Debug: print initialization info to help diagnose auth configuration errors
try {
  // eslint-disable-next-line no-console
  console.log("[firebaseconfig] initialized", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apps: getApps().length,
  });
  // eslint-disable-next-line no-console
  const _auth = getAuth(app);
  // eslint-disable-next-line no-console
  console.log("[firebaseconfig] auth initialized?", Boolean(_auth));
} catch (e) {
  // ignore
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper wrappers (return promise; throw on error)
export async function registerWithEmail(email, password) {
  // returns userCredential
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function sendResetLink(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function logout() {
  return signOut(auth);
}

export async function addUserDoc(uid, data) {
  // Write user document at users/{uid} so security rules can check request.auth.uid
  return setDoc(doc(db, "users", uid), {
    uid,
    ...data,
    createdAt: serverTimestamp(),
  });
}

export default app;
