// firebaseconfig.js
import { getApps, initializeApp } from "firebase/app";
import {
    createUserWithEmailAndPassword,
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import {
    getDownloadURL,
    getStorage,
    ref as storageRef,
    uploadBytes,
} from "firebase/storage";

// Your web app's Firebase configuration (keep this file out of app/ routes folder)
const firebaseConfig = {
  apiKey: "AIzaSyBBn03Xi_UWe0Ca8sTvSMOoViHwttcHwA0",
  authDomain: "caffio-291e7.firebaseapp.com",
  projectId: "caffio-291e7",
  // storageBucket should be the bucket name, not a gs:// URL
  storageBucket: "caffio-291e7.firebasestorage.app",
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
export const storage = getStorage(app);
// debug: show which bucket the storage object is pointing to
// eslint-disable-next-line no-console
console.log(
  "[firebaseconfig] storage bucket",
  storage?._bucket?.name || storage?._delegate?._bucket?.name,
);

// ─── Auth helpers ────────────────────────────────────────────────────────────

export async function registerWithEmail(email, password) {
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
  try {
    const docRef = doc(db, "users", uid);
    const payload = {
      uid,
      ...data,
      createdAt: serverTimestamp(),
    };
    // eslint-disable-next-line no-console
    console.log("[firebaseconfig] addUserDoc: writing user", uid);
    await setDoc(docRef, payload);
    const snap = await getDoc(docRef);
    // eslint-disable-next-line no-console
    console.log(
      "[firebaseconfig] addUserDoc: success",
      uid,
      "exists:",
      snap.exists(),
    );
    if (snap.exists()) {
      // eslint-disable-next-line no-console
      console.log("[firebaseconfig] addUserDoc: data", snap.data());
    }
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[firebaseconfig] addUserDoc failed", e);
    throw e;
  }
}

// ─── Coffee Log helpers ───────────────────────────────────────────────────────

/**
 * Upload a local image URI to Firebase Storage and return the download URL.
 * Path: coffeePhotos/{uid}/{timestamp}.jpg
 */
export async function uploadCoffeePhoto(uid, localUri) {
  // debug: report the URI being uploaded
  // eslint-disable-next-line no-console
  console.log("[firebaseconfig] uploadCoffeePhoto called with", localUri);

  const response = await fetch(localUri);
  if (!response.ok) {
    const msg = `fetch failed status ${response.status}`;
    // eslint-disable-next-line no-console
    console.error("[firebaseconfig] uploadCoffeePhoto fetch error", msg);
    throw new Error(msg);
  }
  const blob = await response.blob();
  const filename = `${Date.now()}.jpg`;
  const photoRef = storageRef(storage, `coffeePhotos/${uid}/${filename}`);

  // attempt upload
  try {
    // eslint-disable-next-line no-console
    console.log(
      "[firebaseconfig] uploadCoffeePhoto uploading to",
      photoRef._location?.path || "<unknown>",
    );
    // print current auth UID for diagnostics
    // eslint-disable-next-line no-console
    console.log(
      "[firebaseconfig] auth.currentUser",
      getAuth(app).currentUser?.uid,
    );
    await uploadBytes(photoRef, blob);
    // eslint-disable-next-line no-console
    console.log("[firebaseconfig] uploadCoffeePhoto upload succeeded");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[firebaseconfig] uploadCoffeePhoto uploadBytes error", err);
    // dump extra error properties if available
    // eslint-disable-next-line no-console
    console.error("customData", err.customData);
    // eslint-disable-next-line no-console
    console.error(
      "serialized",
      JSON.stringify(err, Object.getOwnPropertyNames(err)),
    );
    throw err;
  }

  // attempt to obtain download URL
  try {
    const url = await getDownloadURL(photoRef);
    // eslint-disable-next-line no-console
    console.log("[firebaseconfig] uploadCoffeePhoto downloadURL", url);
    return url;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      "[firebaseconfig] uploadCoffeePhoto getDownloadURL error",
      err,
    );
    throw err;
  }
}

/**
 * Save a coffee log entry to Firestore under users/{uid}/coffeeLogs.
 * If photoLocalUri is provided, uploads the image first and stores the URL.
 *
 * @param {string} uid
 * @param {{ coffeeType: string, cafe: string, rating: number, tasteProfile: string[], photoLocalUri?: string|null }} data
 * @returns {Promise<string>} the new document ID
 */
export async function addCoffeeLog(uid, data) {
  let photoUrl = null;
  if (data.photoLocalUri) {
    // if the caller supplied an image, we require upload to succeed; otherwise
    // we would silently save a log without the picture which is confusing.
    try {
      photoUrl = await uploadCoffeePhoto(uid, data.photoLocalUri);
    } catch (err) {
      // log and rethrow so caller can alert
      // eslint-disable-next-line no-console
      console.error("[firebaseconfig] addCoffeeLog photo upload failed", err);
      throw err;
    }
  }

  const payload = {
    uid,
    coffeeType: data.coffeeType,
    cafe: data.cafe,
    rating: data.rating,
    tasteProfile: data.tasteProfile ?? [],
    photoUrl: photoUrl ?? null,
    createdAt: serverTimestamp(),
  };

  const colRef = collection(db, "users", uid, "coffeeLogs");
  const docSnap = await addDoc(colRef, payload);
  return docSnap.id;
}

/**
 * Fetch all coffee logs for a user, ordered by newest first.
 * @param {string} uid
 * @returns {Promise<Array>}
 */
export async function getCoffeeLogs(uid) {
  const colRef = collection(db, "users", uid, "coffeeLogs");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      // make sure UI components expect "photoUri" instead of backend photoUrl
      photoUri: data.photoUrl ?? null,
      // Convert Firestore Timestamp to JS Date
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    };
  });
}

export default app;
