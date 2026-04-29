import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DailyMacroSummaryProps {
  calories: { consumed: number; goal: number };
  protein: { consumed: number; goal: number };
  carbs: { consumed: number; goal: number };
  fat: { consumed: number; goal: number };
}

interface MiniBarProps {
  label: string;
  consumed: number;
  goal: number;
  color: string;
}

function MiniBar({ label, consumed, goal, color }: MiniBarProps) {
  const remaining = Math.max(0, goal - consumed);
  const pct = Math.min(consumed / goal, 1);

  return (
    <View style={miniStyles.container}>
      <View style={[miniStyles.track]}>
        <View style={[miniStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={miniStyles.label}>{label}</Text>
      <Text style={miniStyles.value}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>{remaining}</Text>
        <Text style={{ color: '#6b7280' }}>g left</Text>
      </Text>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  track: {
    width: '100%',
    height: 6,
    backgroundColor: '#2a2d35',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  label: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 12,
  },
});

export default function DailyMacroSummary({ calories, protein, carbs, fat }: DailyMacroSummaryProps) {
  const calRemaining = Math.max(0, calories.goal - calories.consumed);

  return (
    <View style={styles.container}>
      {/* Calorie summary */}
      <View style={styles.calorieRow}>
        <View style={styles.calorieBlock}>
          <Text style={styles.calorieNumber}>{calories.consumed}</Text>
          <Text style={styles.calorieLabel}>eaten</Text>
        </View>

        <View style={styles.calorieDivider} />

        <View style={styles.calorieBlock}>
          <Text style={[styles.calorieNumber, styles.calorieRemaining]}>{calRemaining}</Text>
          <Text style={styles.calorieLabel}>remaining</Text>
        </View>

        <View style={styles.calorieDivider} />

        <View style={styles.calorieBlock}>
          <Text style={styles.calorieNumber}>{calories.goal}</Text>
          <Text style={styles.calorieLabel}>goal</Text>
        </View>
      </View>

      {/* Macro mini bars */}
      <View style={styles.macroRow}>
        <MiniBar label="Protein" consumed={protein.consumed} goal={protein.goal} color="#818cf8" />
        <MiniBar label="Carbs" consumed={carbs.consumed} goal={carbs.goal} color="#f59e0b" />
        <MiniBar label="Fat" consumed={fat.consumed} goal={fat.goal} color="#f472b6" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  calorieBlock: {
    alignItems: 'center',
    flex: 1,
  },
  calorieNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  calorieRemaining: {
    color: '#4ade80',
  },
  calorieLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  calorieDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2a2d35',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
