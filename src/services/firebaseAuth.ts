import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GoogleSheetsService } from './googleSheetsService';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Standard Google Auth Provider (Basic Profile & Email - No verification required)
const standardProvider = new GoogleAuthProvider();

// Google Sheets Auth Provider (Requested only when connecting Google Sheets database)
const sheetsProvider = new GoogleAuthProvider();
sheetsProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
sheetsProvider.addScope('https://www.googleapis.com/auth/drive.file');

// Cache the access token in memory.
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (requestSheetsScopes = false): Promise<{ user: User; accessToken?: string }> => {
  try {
    isSigningIn = true;
    const provider = requestSheetsScopes ? sheetsProvider : standardProvider;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (credential?.accessToken && requestSheetsScopes) {
      cachedAccessToken = credential.accessToken;
      // Set token for GoogleSheetsService
      GoogleSheetsService.setToken(cachedAccessToken);
    }
    
    return { user: result.user, accessToken: credential?.accessToken || undefined };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  GoogleSheetsService.disconnect();
};
