import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react';

import {
  clearSession,
  getSessionSnapshot,
  requestLoginCode,
  restoreSession,
  subscribeToSession,
  verifyLoginCode,
} from './session';

type AuthContextValue = ReturnType<typeof getSessionSnapshot> & {
  requestCode: typeof requestLoginCode;
  verifyCode: typeof verifyLoginCode;
  signOut: typeof clearSession;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const session = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getSessionSnapshot
  );

  useEffect(() => {
    void restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...session,
        requestCode: requestLoginCode,
        verifyCode: verifyLoginCode,
        signOut: clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
