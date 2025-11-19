import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Firebase user
  const [profile, setProfile] = useState(null); // Firestore profile (role, name, etc.)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            // Use existing profile from Register page
            setProfile({ id: snap.id, ...snap.data() });
          } else {
            // Auto-create a basic profile if missing
            const email = firebaseUser.email || '';
            const defaultName = firebaseUser.displayName || email.split('@')[0] || 'User';

            const defaultProfile = {
              name: defaultName,
              email: email,
              role: 'CUSTOMER',      // default role if created elsewhere
              createdAt: serverTimestamp(),
            };

            await setDoc(userRef, defaultProfile);
            setProfile({ id: firebaseUser.uid, ...defaultProfile });
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const logout = () => signOut(auth);

  const value = { user, profile, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
