import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { createContext, useEffect, useState } from "react";
import { auth, db } from "../../firebaseconfig";

type AppUser = {
  uid: string;
  email: string;
  username: string;
  createdAt?: Date | null;
} | null;

type AuthContextValue = {
  user: AppUser;
};

export const AuthContext = createContext<AuthContextValue>({ user: null });

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppUser>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        if (!fbUser) {
          setUser(null);
          setInitializing(false);
          return;
        }

        try {
          const ref = doc(db, "users", fbUser.uid);
          const snap = await getDoc(ref);
          const data = snap.exists() ? (snap.data() as any) : null;

          
          let createdAt: Date | null = null;
          if (data?.createdAt) {
            if (typeof data.createdAt.toDate === "function") {
              createdAt = data.createdAt.toDate();
            } else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt;
            }
          }

          
          if (!createdAt && (fbUser as any)?.metadata?.creationTime) {
            const ct = (fbUser as any).metadata.creationTime;
            const parsed = new Date(ct);
            if (!isNaN(parsed.getTime())) createdAt = parsed;
          }

          const username =
            data?.username ||
            fbUser.displayName ||
            (fbUser.email ? fbUser.email.split("@")[0] : "");

          setUser({
            uid: fbUser.uid,
            email: fbUser.email || "",
            username,
            createdAt,
          });
          setInitializing(false);
        } catch (e) {
          const username =
            fbUser.displayName ||
            (fbUser.email ? fbUser.email.split("@")[0] : "");
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || "",
            username,
            createdAt: (fbUser as any)?.metadata?.creationTime
              ? new Date((fbUser as any).metadata.creationTime)
              : null,
          });
          setInitializing(false);
        }
      },
    );

    return () => unsub();
  }, []);

  if (initializing) return null;

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
