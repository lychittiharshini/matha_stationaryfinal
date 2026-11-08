import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithAdminCredentials: (adminIdInput: string, passwordInput: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

export const AUTHORIZED_ADMIN_USERNAME = 'harshinilychitti';
export const AUTHORIZED_ADMIN_EMAIL = 'lychittiharshini2008@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('sdm_admin_authenticated') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const email = currentUser.email?.toLowerCase();
          // Check if user matches authorized bootstrap admin email
          const isEmailMatch = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

          // Check custom claims
          const idTokenResult = await currentUser.getIdTokenResult(true).catch(() => null);
          const hasAdminClaim = idTokenResult?.claims?.admin === true || idTokenResult?.claims?.role === 'admin';

          // Check Firestore admins collection
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid)).catch(() => null);
          const hasAdminDoc = adminDoc && adminDoc.exists();

          if (isEmailMatch || hasAdminClaim || hasAdminDoc) {
            setIsAdmin(true);
            sessionStorage.setItem('sdm_admin_authenticated', 'true');
          } else {
            // Unauthorized account signed in - reject and sign out
            await firebaseSignOut(auth).catch(() => {});
            setIsAdmin(false);
            sessionStorage.removeItem('sdm_admin_authenticated');
          }
        } catch (e) {
          console.warn('Error checking admin permissions:', e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        sessionStorage.removeItem('sdm_admin_authenticated');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithAdminCredentials = async (
    adminIdInput: string,
    passwordInput: string
  ): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);

    const cleanInput = adminIdInput.trim().toLowerCase();

    // 1. Strict Username/Admin ID verification
    // Only the authorized admin username 'harshinilychitti' or the admin email is accepted
    const isAuthorizedId =
      cleanInput === AUTHORIZED_ADMIN_USERNAME.toLowerCase() ||
      cleanInput === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

    if (!isAuthorizedId) {
      setAuthError('Access Denied: Invalid Admin ID. Only the store administrator is permitted to log in.');
      setIsLoading(false);
      return false;
    }

    const targetEmail = AUTHORIZED_ADMIN_EMAIL;

    try {
      let loggedUser: User | null = null;
      try {
        const credential = await signInWithEmailAndPassword(auth, targetEmail, passwordInput);
        loggedUser = credential.user;
      } catch (signInErr: any) {
        // If user does not exist in Firebase Auth yet, provision on first authorized login
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential'
        ) {
          try {
            const createRes = await createUserWithEmailAndPassword(auth, targetEmail, passwordInput);
            loggedUser = createRes.user;
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error('Incorrect password. Please enter the private password configured for your admin account in Firebase Authentication.');
            }
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      }

      if (loggedUser) {
        const userEmail = loggedUser.email?.toLowerCase();
        if (userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
          // Register in admins collection with strict metadata
          await setDoc(
            doc(db, 'admins', loggedUser.uid),
            {
              role: 'admin',
              adminId: AUTHORIZED_ADMIN_USERNAME,
              email: targetEmail,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          ).catch((e) => console.warn('Could not update admin doc', e));

          setIsAdmin(true);
          sessionStorage.setItem('sdm_admin_authenticated', 'true');
          setIsLoading(false);
          return true;
        } else {
          await firebaseSignOut(auth);
          setIsAdmin(false);
          sessionStorage.removeItem('sdm_admin_authenticated');
          setAuthError('Access Denied: Unauthorized credentials.');
          setIsLoading(false);
          return false;
        }
      }

      setIsLoading(false);
      return false;
    } catch (err: any) {
      console.error('Admin Auth Error:', err);
      let msg = 'Authentication failed. Please verify your credentials.';
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.message?.includes('Incorrect password')
      ) {
        msg = 'Incorrect password. Please enter the private password configured for your admin account in Firebase Authentication.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. For security, please wait a few minutes before trying again.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password provider is not yet enabled in your Firebase Console. Please enable "Email/Password" in Firebase Authentication > Sign-in method.';
      } else if (err.message) {
        msg = err.message;
      }
      setAuthError(msg);
      setIsAdmin(false);
      sessionStorage.removeItem('sdm_admin_authenticated');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Sign out error', e);
    }
    setIsAdmin(false);
    sessionStorage.removeItem('sdm_admin_authenticated');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        loginWithAdminCredentials,
        logout,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

