import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MacroBar from './MacroBar';
import { useThemeColors } from '../../types/theme';

interface MacroData {
  consumed: number;
  goal: number;
}

interface MacroBreakdownProps {
  protein: MacroData;
  carbs: MacroData;
  fat: MacroData;
}

const MACRO_CONFIG = [
  { key: 'protein' as const, label: 'Protein', color: '#818cf8' },
  { key: 'carbs' as const, label: 'Carbs', color: '#f59e0b' },
  { key: 'fat' as const, label: 'Fat', color: '#f472b6' },
];

export default function MacroBreakdown({ protein, carbs, fat }: MacroBreakdownProps) {
  const macros = { protein, carbs, fat };
  const theme = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Macronutrients</Text>
      {MACRO_CONFIG.map((macro) => (
        <MacroBar
          key={macro.key}
          label={macro.label}
          consumed={macros[macro.key].consumed}
          goal={macros[macro.key].goal}
          color={macro.color}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
});
