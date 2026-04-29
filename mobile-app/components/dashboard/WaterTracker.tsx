import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface WaterTrackerProps {
  glasses: number;
  goal?: number;
  onGlassesChange: (glasses: number) => void;
}

const WATER_COLOR = '#38bdf8';
const WATER_COLOR_DIM = '#1e3a4d';

export default function WaterTracker({ glasses, goal = 8, onGlassesChange }: WaterTrackerProps) {
  const handleTap = (index: number) => {
    // If tapping the last filled glass, unfill it (toggle behavior)
    if (index + 1 === glasses) {
      onGlassesChange(index);
    } else {
      onGlassesChange(index + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Water Intake</Text>
        <Text style={styles.counter}>
          <Text style={styles.counterCurrent}>{glasses}</Text>
          <Text style={styles.counterSeparator}> / {goal} </Text>
          <Text style={styles.counterUnit}>glasses</Text>
        </Text>
      </View>

      <View style={styles.glassRow}>
        {Array.from({ length: goal }, (_, i) => {
          const isFilled = i < glasses;
          return (
            <Pressable
              key={i}
              onPress={() => handleTap(i)}
              style={({ pressed }) => [
                styles.glassButton,
                pressed && styles.glassButtonPressed,
              ]}
            >
              <Ionicons
                name={isFilled ? 'water' : 'water-outline'}
                size={26}
                color={isFilled ? WATER_COLOR : WATER_COLOR_DIM}
              />
            </Pressable>
          );
        })}
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
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  counter: {
    fontSize: 14,
  },
  counterCurrent: {
    color: WATER_COLOR,
    fontWeight: '700',
    fontSize: 16,
  },
  counterSeparator: {
    color: '#6b7280',
    fontWeight: '500',
  },
  counterUnit: {
    color: '#6b7280',
    fontWeight: '500',
  },
  glassRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glassButton: {
    padding: 6,
    borderRadius: 12,
  },
  glassButtonPressed: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    transform: [{ scale: 1.15 }],
  },
});
