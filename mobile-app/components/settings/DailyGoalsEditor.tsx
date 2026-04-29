import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DailyGoals } from '../../types/settings';

interface DailyGoalsEditorProps {
  goals: DailyGoals;
  onSave: (goals: DailyGoals) => void;
}

interface GoalFieldProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  onChange: (value: number) => void;
  isLast?: boolean;
}

function GoalField({ label, value, unit, color, onChange, isLast }: GoalFieldProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value.toString());

  const save = () => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      onChange(num);
    } else {
      setText(value.toString());
    }
    setEditing(false);
  };

  return (
    <View style={[styles.field, !isLast && styles.fieldBorder]}>
      <View style={styles.fieldLeft}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>

      {editing ? (
        <View style={styles.editWrap}>
          <TextInput
            style={styles.fieldInput}
            value={text}
            onChangeText={setText}
            keyboardType="numeric"
            autoFocus
            onSubmitEditing={save}
            onBlur={save}
            selectTextOnFocus
          />
          <Text style={styles.fieldUnit}>{unit}</Text>
        </View>
      ) : (
        <Pressable onPress={() => { setEditing(true); setText(value.toString()); }} style={styles.valueWrap}>
          <Text style={styles.fieldValue}>{value}</Text>
          <Text style={styles.fieldUnit}>{unit}</Text>
          <Ionicons name="pencil-outline" size={14} color="#4b5563" />
        </Pressable>
      )}
    </View>
  );
}

export default function DailyGoalsEditor({ goals, onSave }: DailyGoalsEditorProps) {
  const update = (key: keyof DailyGoals, value: number) => {
    onSave({ ...goals, [key]: value });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.groupTitle}>Daily Goals</Text>
      <View style={styles.card}>
        <GoalField label="Calories" value={goals.calories} unit="kcal" color="#8b5cf6" onChange={(v) => update('calories', v)} />
        <GoalField label="Protein" value={goals.protein} unit="g" color="#818cf8" onChange={(v) => update('protein', v)} />
        <GoalField label="Carbs" value={goals.carbs} unit="g" color="#f59e0b" onChange={(v) => update('carbs', v)} />
        <GoalField label="Fat" value={goals.fat} unit="g" color="#f472b6" onChange={(v) => update('fat', v)} />
        <GoalField label="Water" value={goals.waterGlasses} unit="glasses" color="#38bdf8" onChange={(v) => update('waterGlasses', v)} isLast />
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
    overflow: 'hidden',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  fieldBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d35',
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fieldLabel: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '500',
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fieldValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  fieldUnit: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
  },
  fieldInput: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: '#8b5cf6',
    paddingVertical: 2,
    minWidth: 50,
    textAlign: 'right',
  },
});
