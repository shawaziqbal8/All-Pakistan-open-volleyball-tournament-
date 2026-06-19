import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp, (firebaseConfig as any).firestoreDatabaseId);

export const provider = new GoogleAuthProvider();

export const initAuth = (
  onAuthSuccess?: (user: User) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Performs Google Pop-up Sign In and extracts the exact Google Sheets OAuth access token.
 */
export const googleSignIn = async (): Promise<{ user: User } | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    return { user: result.user };
  } catch (error: any) {
    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
      console.warn('Google Sign-In Error:', error);
    }
    throw error;
  }
};

/**
 * Returns the cached in-memory access token.
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};
