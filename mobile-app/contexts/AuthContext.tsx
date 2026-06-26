import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import LockScreen from '../components/auth/LockScreen';
import { useSettings } from './SettingsContext';

interface AuthContextType {
  isUnlocked: boolean;
  unlock: () => void;
}

const AuthContext = createContext<AuthContextType>({ isUnlocked: true, unlock: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useSettings();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);

  // Re-lock after 30 seconds in background
  const RE_LOCK_TIMEOUT_MS = 30_000;

  const unlock = useCallback(() => setIsUnlocked(true), []);

  // When biometricLock is disabled, stay unlocked; when enabled, start locked
  useEffect(() => {
    if (isLoading) return;
    if (!settings.biometricLock) {
      setIsUnlocked(true);
    } else {
      // Lock on first mount when feature is enabled
      setIsUnlocked(false);
    }
  }, [settings.biometricLock, isLoading]);

  // Re-lock when app comes back from background after timeout
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appState.current;
      appState.current = nextState;

      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (nextState === 'active') {
        const elapsed = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        backgroundedAt.current = null;
        if (settings.biometricLock && elapsed >= RE_LOCK_TIMEOUT_MS) {
          setIsUnlocked(false);
        }
      }
    });

    return () => sub.remove();
  }, [settings.biometricLock]);

  // Don't render gate until settings are loaded
  if (isLoading) return <>{children}</>;

  // Show lock screen if locked and biometric lock is enabled
  if (settings.biometricLock && !isUnlocked) {
    return (
      <AuthContext.Provider value={{ isUnlocked, unlock }}>
        <LockScreen onUnlock={unlock} />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ isUnlocked, unlock }}>
      {children}
    </AuthContext.Provider>
  );
}
