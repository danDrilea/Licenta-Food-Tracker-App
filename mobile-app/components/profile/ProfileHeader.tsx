import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../../types/theme';

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  avatarUri?: string | null;
  onEditPress?: () => void;
}

export default function ProfileHeader({ firstName, lastName, avatarUri, onEditPress }: ProfileHeaderProps) {
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  const theme = useThemeColors();

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarOuter}>
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.image} />
          ) : (
            <Text style={styles.initials}>{initials}</Text>
          )}
        </View>
        <Pressable style={[styles.cameraBtn, { backgroundColor: theme.border, borderColor: theme.background }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEditPress?.(); }}>
          <Ionicons name="camera" size={14} color={theme.textPrimary} />
        </Pressable>
      </View>

      {/* Name */}
      <Text style={[styles.name, { color: theme.textPrimary }]}>{firstName} {lastName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarOuter: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6d28d9',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
});
