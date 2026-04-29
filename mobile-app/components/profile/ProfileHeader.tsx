import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  avatarUri?: string;
  onEditPress?: () => void;
}

export default function ProfileHeader({ firstName, lastName, onEditPress }: ProfileHeaderProps) {
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarOuter}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Pressable style={styles.cameraBtn} onPress={onEditPress}>
          <Ionicons name="camera" size={14} color="#fff" />
        </Pressable>
      </View>

      {/* Name */}
      <Text style={styles.name}>{firstName} {lastName}</Text>
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
    backgroundColor: '#2a2d35',
    borderWidth: 2,
    borderColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
});
