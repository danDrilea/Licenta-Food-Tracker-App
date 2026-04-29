import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { UNIT_LABELS } from '../../types/settings';
import type { WeightUnit, HeightUnit, EnergyUnit } from '../../types/settings';

interface UnitOptionProps<T extends string> {
  label: string;
  value: T;
  selected: boolean;
  onSelect: (value: T) => void;
}

function UnitOption<T extends string>({ label, value, selected, onSelect }: UnitOptionProps<T>) {
  return (
    <Pressable
      style={[styles.option, selected && styles.optionSelected]}
      onPress={() => onSelect(value)}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      {selected && <Ionicons name="checkmark-circle" size={18} color="#8b5cf6" />}
    </Pressable>
  );
}

interface UnitSelectorProps {
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  energyUnit: EnergyUnit;
  onWeightChange: (unit: WeightUnit) => void;
  onHeightChange: (unit: HeightUnit) => void;
  onEnergyChange: (unit: EnergyUnit) => void;
}

export default function UnitSelector({
  weightUnit,
  heightUnit,
  energyUnit,
  onWeightChange,
  onHeightChange,
  onEnergyChange,
}: UnitSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.groupTitle}>Units</Text>
      <View style={styles.card}>
        {/* Weight */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Weight</Text>
          <View style={styles.optionsRow}>
            <UnitOption label={UNIT_LABELS.kg} value="kg" selected={weightUnit === 'kg'} onSelect={onWeightChange} />
            <UnitOption label={UNIT_LABELS.lbs} value="lbs" selected={weightUnit === 'lbs'} onSelect={onWeightChange} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Height */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Height</Text>
          <View style={styles.optionsRow}>
            <UnitOption label={UNIT_LABELS.cm} value="cm" selected={heightUnit === 'cm'} onSelect={onHeightChange} />
            <UnitOption label={UNIT_LABELS.ft} value="ft" selected={heightUnit === 'ft'} onSelect={onHeightChange} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Energy */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Energy</Text>
          <View style={styles.optionsRow}>
            <UnitOption label={UNIT_LABELS.kcal} value="kcal" selected={energyUnit === 'kcal'} onSelect={onEnergyChange} />
            <UnitOption label={UNIT_LABELS.kj} value="kj" selected={energyUnit === 'kj'} onSelect={onEnergyChange} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  groupTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
    padding: 14,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#2a2d35',
  },
  optionSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#8b5cf650',
  },
  optionText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#e5e7eb',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2d35',
    marginVertical: 12,
  },
});
