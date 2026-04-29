import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { UserGoal, GOAL_LABELS } from '../../types/profile';

interface GoalSectionProps {
  goal: UserGoal;
  currentWeight: number;
  onEditPress?: () => void;
}

const GOAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  weight_loss: 'trending-down',
  weight_gain: 'trending-up',
  maintain: 'remove-outline',
  custom: 'options-outline',
};

const GOAL_COLORS: Record<string, string> = {
  weight_loss: '#4ade80',
  weight_gain: '#38bdf8',
  maintain: '#facc15',
  custom: '#c77ffb',
};

export default function GoalSection({ goal, currentWeight, onEditPress }: GoalSectionProps) {
  const color = GOAL_COLORS[goal.type];
  const icon = GOAL_ICONS[goal.type];
  const diff = goal.targetWeight
    ? Math.abs(goal.targetWeight - currentWeight).toFixed(1)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Goal</Text>
        <Pressable onPress={onEditPress} hitSlop={10}>
          <Ionicons name="create-outline" size={20} color="#8b5cf6" />
        </Pressable>
      </View>

      <View style={[styles.card, { borderColor: `${color}30` }]}>
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={22} color={color} />
          </View>

          <View style={styles.info}>
            <Text style={[styles.goalType, { color }]}>
              {GOAL_LABELS[goal.type]}
            </Text>

            {goal.targetWeight != null && (
              <Text style={styles.targetText}>
                Target: {goal.targetWeight} kg
                {diff ? ` (${diff} kg to go)` : ''}
              </Text>
            )}

            {goal.weeklyRate != null && (
              <Text style={styles.rateText}>
                {goal.weeklyRate} kg/week
              </Text>
            )}

            {goal.type === 'custom' && goal.customCalorieTarget != null && (
              <Text style={styles.targetText}>
                {goal.customCalorieTarget} kcal/day target
              </Text>
            )}
          </View>
        </View>
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
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  goalType: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  targetText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
  },
  rateText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
