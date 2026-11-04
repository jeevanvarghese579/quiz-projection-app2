import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, FIREBASE_WEB_APP_ID, functions } from '@/firebase/client';

type AccessState = 'loading' | 'signed-out' | 'checking' | 'authorized' | 'pending' | 'rejected' | 'unauthorized' | 'error';

interface AuthContextValue {
  user: User | null;
  accessState: AccessState;
  error: string;
  signInWithGoogle: () => Promise<void>;
  requestAccess: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccess: () => Promise<void>;
}

interface AccessCheckResponse {
  allowed: boolean;
  requestStatus?: 'pending' | 'approved' | 'rejected';
}

const AuthContext = createContext<AuthContextValue | null>(null);

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unable to complete Firebase authentication.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessState, setAccessState] = useState<AccessState>('loading');
  const [error, setError] = useState('');

  const checkAccess = useCallback(async (currentUser: User) => {
    setAccessState('checking');
    setError('');
    try {
      await currentUser.getIdToken(true);
      const checkMyAccess = httpsCallable<{ appId: string }, AccessCheckResponse>(functions, 'checkMyAccess');
      const result = await checkMyAccess({ appId: FIREBASE_WEB_APP_ID });
      if (result.data.allowed) {
        setAccessState('authorized');
        return;
      }
      setAccessState(result.data.requestStatus === 'approved' ? 'authorized' : (result.data.requestStatus ?? 'unauthorized'));
    } catch (accessError) {
      setError(messageFromError(accessError));
      setAccessState('error');
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    if (!nextUser) {
      setAccessState('signed-out');
      setError('');
      return;
    }
    void checkAccess(nextUser);
  }), [checkAccess]);

  const signInWithGoogle = useCallback(async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      setUser(credential.user);
      await checkAccess(credential.user);
    } catch (signInError) {
      setError(messageFromError(signInError));
      setAccessState('signed-out');
    }
  }, [checkAccess]);

  const requestAccess = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const requestAppAccess = httpsCallable<
        { appId: string; requestType: string },
        { status: 'created' | 'pending' | 'approved' | 'rejected' | 'already-approved' }
      >(functions, 'requestAppAccess');
      const result = await requestAppAccess({ appId: FIREBASE_WEB_APP_ID, requestType: 'administrator' });
      if (result.data.status === 'approved' || result.data.status === 'already-approved') await checkAccess(user);
      else setAccessState(result.data.status === 'rejected' ? 'rejected' : 'pending');
    } catch (requestError) {
      setError(messageFromError(requestError));
      setAccessState('error');
    }
  }, [checkAccess, user]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const refreshAccess = useCallback(async () => {
    if (user) await checkAccess(user);
  }, [checkAccess, user]);

  const value = useMemo(() => ({
    user, accessState, error, signInWithGoogle, requestAccess, signOut, refreshAccess,
  }), [user, accessState, error, signInWithGoogle, requestAccess, signOut, refreshAccess]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
