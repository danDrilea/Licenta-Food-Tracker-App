import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { UserProfile, ACTIVITY_LABELS, calculateAge } from '../../types/profile';
import { useThemeColors } from '../../types/theme';

interface UserInfoSectionProps {
  user: UserProfile;
  onEditPress?: () => void;
}

interface InfoRowProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  const theme = useThemeColors();
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={16} color="#8b5cf6" />
        <Text style={[styles.rowLabel, { color: theme.textMuted }]}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{value}</Text>
    </View>
  );
}

export default function UserInfoSection({ user, onEditPress }: UserInfoSectionProps) {
  const age = calculateAge(user.dateOfBirth);
  const theme = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Personal Info</Text>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEditPress?.(); }} hitSlop={10}>
          <Ionicons name="create-outline" size={20} color="#8b5cf6" />
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <InfoRow icon="person-outline" label="Name" value={`${user.firstName} ${user.lastName}`} />
        <InfoRow icon="calendar-outline" label="Age" value={`${age} years`} />
        <InfoRow icon="flag-outline" label="Country" value={user.country} />
        <InfoRow icon="male-female-outline" label="Sex" value={user.sex === 'male' ? 'Male' : 'Female'} />
        <InfoRow icon="resize-outline" label="Height" value={`${user.heightCm} cm`} />
        <InfoRow icon="scale-outline" label="Weight" value={`${user.currentWeightKg} kg`} />
        <InfoRow icon="flash-outline" label="Activity" value={ACTIVITY_LABELS[user.activityLevel]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
