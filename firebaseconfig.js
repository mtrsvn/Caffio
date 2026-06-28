import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  getReactNativePersistence,
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
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import * as ImageManipulator from "expo-image-manipulator";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

let _authInstance;
try {
  _authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log("[firebaseconfig] auth initialized with AsyncStorage persistence");
} catch (e) {
  // initializeAuth throws if already initialized (e.g. hot reload)
  _authInstance = getAuth(app);
  console.log("[firebaseconfig] auth already initialized, reusing instance");
}

export const auth = _authInstance;
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
  
  let finalUri = localUri;
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: 1080 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    finalUri = manipResult.uri;
  } catch (e) {
    console.warn("[firebaseconfig] Image compression failed, using original", e);
  }

  const blob = await localUriToBlob(finalUri);
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

async function localUriToBlob(localUri) {
  try {
    const response = await fetch(localUri);
    if (!response.ok) {
      throw new Error(`fetch failed status ${response.status}`);
    }
    return await response.blob();
  } catch (fetchErr) {
    console.warn(
      "[firebaseconfig] localUriToBlob fetch failed, trying XHR fallback",
      fetchErr,
    );

    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new Error("XHR blob conversion failed"));
      xhr.responseType = "blob";
      xhr.open("GET", localUri, true);
      xhr.send(null);
    });
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
    price: data.price !== undefined ? Number(data.price) : 0,
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
  if (payload.price !== undefined) {
    payload.price = Number(payload.price);
  }
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
      price: data.price ? Number(data.price) : 0,

      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    };
  });
}

export async function uploadUserAvatar(uid, localUri) {
  console.log("[firebaseconfig] uploadUserAvatar called with", localUri);
  
  let finalUri = localUri;
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: 512 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    finalUri = manipResult.uri;
  } catch (e) {
    console.warn("[firebaseconfig] Image compression failed, using original", e);
  }

  const blob = await localUriToBlob(finalUri);
  const photoRef = storageRef(storage, `userAvatars/${uid}/avatar.jpg`);

  try {
    await uploadBytes(photoRef, blob);
    const photoUrl = await getDownloadURL(photoRef);
    
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { photoUrl, updatedAt: serverTimestamp() }, { merge: true });
    
    return photoUrl;
  } catch (err) {
    console.error("[firebaseconfig] uploadUserAvatar error", err);
    throw err;
  }
}

export async function removeUserAvatar(uid) {
  try {
    const photoRef = storageRef(storage, `userAvatars/${uid}/avatar.jpg`);
    await deleteObject(photoRef).catch(() => console.log("No file to delete in storage"));

    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { photoUrl: null, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (err) {
    console.error("[firebaseconfig] removeUserAvatar error", err);
    throw err;
  }
}

export async function updateUserProfile(uid, data) {
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (err) {
    console.error("[firebaseconfig] updateUserProfile error", err);
    throw err;
  }
}
export async function saveUserRecommendations(uid, recommendations) {
  try {
    const docRef = doc(db, "users", uid, "recommendations", "latest");
    await setDoc(docRef, { recommendations, updatedAt: serverTimestamp() });
    return true;
  } catch (err) {
    console.error("[firebaseconfig] saveUserRecommendations error", err);
    throw err;
  }
}

export async function getUserRecommendations(uid) {
  try {
    const docRef = doc(db, "users", uid, "recommendations", "latest");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().recommendations || [];
    }
    return [];
  } catch (err) {
    console.error("[firebaseconfig] getUserRecommendations error", err);
    throw err;
  }
}

export async function saveUserPersonality(uid, personality, logCount) {
  try {
    const docRef = doc(db, "users", uid, "personality", "latest");
    await setDoc(docRef, { personality, logCount, updatedAt: serverTimestamp() });
    return true;
  } catch (err) {
    console.error("[firebaseconfig] saveUserPersonality error", err);
    throw err;
  }
}

export async function getUserPersonality(uid) {
  try {
    const docRef = doc(db, "users", uid, "personality", "latest");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() || null;
    }
    return null;
  } catch (err) {
    console.error("[firebaseconfig] getUserPersonality error", err);
    throw err;
  }
}

export default app;
