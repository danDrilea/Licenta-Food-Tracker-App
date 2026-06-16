import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../../types/theme';

interface WaterTrackerProps {
  glasses: number;
  goal?: number;
  onGlassesChange: (glasses: number) => void;
}

const WATER_COLOR = '#38bdf8';

const MAX_GLASSES_DISPLAY = 32;

export default function WaterTracker({ glasses, goal = 8, onGlassesChange }: WaterTrackerProps) {
  // Cap the goal for display purposes
  const displayGoal = Math.min(goal, MAX_GLASSES_DISPLAY);
  const theme = useThemeColors();
  
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
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Water Intake</Text>
        <Text style={styles.counter}>
          <Text style={styles.counterCurrent}>{glasses}</Text>
          <Text style={[styles.counterSeparator, { color: theme.textDim }]}> / {goal} </Text>
          <Text style={[styles.counterUnit, { color: theme.textDim }]}>glasses</Text>
        </Text>
      </View>

      <View style={styles.glassGrid}>
        {Array.from({ length: displayGoal }, (_, i) => {
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
                color={isFilled ? WATER_COLOR : theme.waterDim}
              />
            </Pressable>
          );
        })}
        {/* If goal > displayGoal, maybe show a hint or just cap it */}
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
    fontWeight: '500',
  },
  counterUnit: {
    fontWeight: '500',
  },
  glassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginLeft: -6, // Offset the button padding
  },
  glassButton: {
    padding: 6,
    borderRadius: 12,
    width: '12.5%', // Exactly 8 per row
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassButtonPressed: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    transform: [{ scale: 1.15 }],
  },
});
