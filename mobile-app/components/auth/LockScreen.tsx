import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'none'>('none');

  // Detect available biometric type for the icon
  useEffect(() => {
    (async () => {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      }
    })();
  }, []);

  const authenticate = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Food Tracker',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
      } else if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        setAuthError(null);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setAuthError('Authentication failed. Please try again.');
      }
    } catch {
      setAuthError('Biometrics unavailable. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, onUnlock]);

  const biometricIcon =
    biometricType === 'face' ? 'scan-outline' :
    biometricType === 'fingerprint' ? 'finger-print-outline' :
    'lock-closed-outline';

  const biometricLabel =
    biometricType === 'face' ? 'Face ID' :
    biometricType === 'fingerprint' ? 'Fingerprint' :
    'Biometrics';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.iconRing}>
          <Ionicons name="nutrition" size={44} color="#c77ffb" />
        </View>
        <Text style={styles.appName}>Food Tracker</Text>
        <Text style={styles.subtitle}>Authentication required</Text>
      </View>

      {/* Auth button */}
      <View style={styles.authArea}>
        <Pressable
          style={({ pressed }) => [
            styles.authButton,
            pressed && styles.authButtonPressed,
            isAuthenticating && styles.authButtonDisabled,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            authenticate();
          }}
          disabled={isAuthenticating}
        >
          <Ionicons name={biometricIcon as any} size={32} color="#ffffff" />
          <Text style={styles.authButtonText}>
            {isAuthenticating ? 'Verifying…' : `Unlock with ${biometricLabel}`}
          </Text>
        </Pressable>

        {authError && (
          <Text style={styles.errorText}>{authError}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d12',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  logoArea: {
    alignItems: 'center',
    gap: 16,
    marginTop: 40,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(199, 127, 251, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(199, 127, 251, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  authArea: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  authButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  authButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
