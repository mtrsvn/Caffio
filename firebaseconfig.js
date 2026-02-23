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
  deleteDoc,
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

const firebaseConfig = {
  apiKey: "AIzaSyBBn03Xi_UWe0Ca8sTvSMOoViHwttcHwA0",
  authDomain: "caffio-291e7.firebaseapp.com",
  projectId: "caffio-291e7",

  storageBucket: "caffio-291e7.firebasestorage.app",
  messagingSenderId: "137243555767",
  appId: "1:137243555767:web:3cb68cc1f4d6696f0a5a32",
  measurementId: "G-5K4VKJ8SV7",
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

try {
  console.log("[firebaseconfig] initialized", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apps: getApps().length,
  });

  const _auth = getAuth(app);

  console.log("[firebaseconfig] auth initialized?", Boolean(_auth));
} catch (e) {}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log(
  "[firebaseconfig] storage bucket",
  storage?._bucket?.name || storage?._delegate?._bucket?.name,
);

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

    console.log("[firebaseconfig] addUserDoc: writing user", uid);
    await setDoc(docRef, payload);
    const snap = await getDoc(docRef);

    console.log(
      "[firebaseconfig] addUserDoc: success",
      uid,
      "exists:",
      snap.exists(),
    );
    if (snap.exists()) {
      console.log("[firebaseconfig] addUserDoc: data", snap.data());
    }
    return true;
  } catch (e) {
    console.error("[firebaseconfig] addUserDoc failed", e);
    throw e;
  }
}

export async function uploadCoffeePhoto(uid, localUri) {
  console.log("[firebaseconfig] uploadCoffeePhoto called with", localUri);

  const response = await fetch(localUri);
  if (!response.ok) {
    const msg = `fetch failed status ${response.status}`;

    console.error("[firebaseconfig] uploadCoffeePhoto fetch error", msg);
    throw new Error(msg);
  }
  const blob = await response.blob();
  const filename = `${Date.now()}.jpg`;
  const photoRef = storageRef(storage, `coffeePhotos/${uid}/${filename}`);

  try {
    console.log(
      "[firebaseconfig] uploadCoffeePhoto uploading to",
      photoRef._location?.path || "<unknown>",
    );

    console.log(
      "[firebaseconfig] auth.currentUser",
      getAuth(app).currentUser?.uid,
    );
    await uploadBytes(photoRef, blob);

    console.log("[firebaseconfig] uploadCoffeePhoto upload succeeded");
  } catch (err) {
    console.error("[firebaseconfig] uploadCoffeePhoto uploadBytes error", err);

    console.error("customData", err.customData);

    console.error(
      "serialized",
      JSON.stringify(err, Object.getOwnPropertyNames(err)),
    );
    throw err;
  }

  try {
    const url = await getDownloadURL(photoRef);

    console.log("[firebaseconfig] uploadCoffeePhoto downloadURL", url);
    return url;
  } catch (err) {
    console.error(
      "[firebaseconfig] uploadCoffeePhoto getDownloadURL error",
      err,
    );
    throw err;
  }
}

export async function addCoffeeLog(uid, data) {
  let photoUrl = null;
  if (data.photoLocalUri) {
    try {
      photoUrl = await uploadCoffeePhoto(uid, data.photoLocalUri);
    } catch (err) {
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
    favorite: data.favorite ?? false,
    createdAt: serverTimestamp(),
  };

  const colRef = collection(db, "users", uid, "coffeeLogs");
  const docSnap = await addDoc(colRef, payload);
  return docSnap.id;
}

export async function updateCoffeeLog(uid, logId, data) {
  const docRef = doc(db, "users", uid, "coffeeLogs", logId);

  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteCoffeeLog(uid, logId) {
  const docRef = doc(db, "users", uid, "coffeeLogs", logId);
  await deleteDoc(docRef);
}

export async function getCoffeeLogs(uid) {
  const colRef = collection(db, "users", uid, "coffeeLogs");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,

      photoUri: data.photoUrl ?? null,
      favorite: data.favorite ?? false,

      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    };
  });
}

export default app;
