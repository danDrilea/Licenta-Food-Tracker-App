import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface StreakCounterProps {
  days: number;
}

function getMotivation(days: number): string {
  if (days === 0) return 'Start logging today!';
  if (days === 1) return 'Great start!';
  if (days < 7) return 'Keep it going!';
  if (days < 14) return 'One week strong!';
  if (days < 30) return "You're on fire!";
  return 'Unstoppable!';
}

export default function StreakCounter({ days }: StreakCounterProps) {
  const motivation = getMotivation(days);

  return (
    <View style={styles.container}>
      <View style={styles.flameGlow} />
      <View style={styles.content}>
        <View style={styles.flameWrapper}>
          <Ionicons name="flame" size={36} color="#f97316" />
        </View>
        <View style={styles.textBlock}>
          <View style={styles.daysRow}>
            <Text style={styles.daysNumber}>{days}</Text>
            <Text style={styles.daysLabel}> day{days !== 1 ? 's' : ''} streak</Text>
          </View>
          <Text style={styles.motivation}>{motivation}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
    overflow: 'hidden',
  },
  flameGlow: {
    position: 'absolute',
    top: -20,
    left: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flameWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1 },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  daysNumber: {
    color: '#f97316',
    fontSize: 28,
    fontWeight: '800',
  },
  daysLabel: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
  },
  motivation: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
});
