import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MacroBarProps {
  label: string;
  consumed: number;
  goal: number;
  color: string;
  unit?: string;
}

export default function MacroBar({ label, consumed, goal, color, unit = 'g' }: MacroBarProps) {
  const percentage = Math.min(consumed / goal, 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.values}>
          <Text style={styles.consumed}>{consumed}</Text>
          <Text style={styles.separator}> / </Text>
          <Text style={styles.goal}>{goal}{unit}</Text>
        </Text>
      </View>

      <View style={styles.trackOuter}>
        <View
          style={[
            styles.trackFill,
            {
              width: `${percentage * 100}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  values: {
    fontSize: 13,
  },
  consumed: {
    color: '#ffffff',
    fontWeight: '600',
  },
  separator: {
    color: '#6b7280',
  },
  goal: {
    color: '#6b7280',
    fontWeight: '500',
  },
  trackOuter: {
    height: 8,
    backgroundColor: '#2a2d35',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
});
