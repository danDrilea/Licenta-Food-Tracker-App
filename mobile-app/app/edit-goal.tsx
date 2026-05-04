import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../hooks/useProfile';
import { GOAL_LABELS, UserGoal, GoalType } from '../types/profile';

const GOAL_OPTIONS: { type: GoalType; icon: keyof typeof Ionicons.glyphMap; color: string; description: string }[] = [
  { type: 'weight_loss', icon: 'trending-down', color: '#4ade80', description: 'Lose body fat safely' },
  { type: 'weight_gain', icon: 'trending-up', color: '#38bdf8', description: 'Build muscle and mass' },
  { type: 'maintain', icon: 'remove-outline', color: '#facc15', description: 'Maintain current weight' },
  { type: 'custom', icon: 'options-outline', color: '#c77ffb', description: 'Custom target goals' },
];

const RATES = [0.25, 0.5, 0.75, 1.0];

export default function EditGoalScreen() {
  const router = useRouter();
  const { profile, updateGoal } = useProfile();

  const [type, setType] = useState<GoalType>('maintain');
  const [targetWeight, setTargetWeight] = useState('');
  const [weeklyRate, setWeeklyRate] = useState(0.5);

  useEffect(() => {
    if (profile?.goal) {
      setType(profile.goal.type);
      setTargetWeight(profile.goal.targetWeight?.toString() ?? '');
      setWeeklyRate(profile.goal.weeklyRate ?? 0.5);
    }
  }, [profile]);

  const handleSave = async () => {
    const goal: UserGoal = {
      type,
      targetWeight: type !== 'maintain' ? parseFloat(targetWeight) || 70 : undefined,
      weeklyRate: (type === 'weight_loss' || type === 'weight_gain') ? weeklyRate : undefined,
    };

    await updateGoal(goal);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Fitness Goal',
        headerStyle: { backgroundColor: '#1e2126' },
        headerTintColor: '#ffffff',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>CHOOSE YOUR GOAL</Text>
        <View style={styles.grid}>
          {GOAL_OPTIONS.map((opt) => (
            <Pressable 
              key={opt.type} 
              style={[
                styles.goalCard, 
                type === opt.type && { borderColor: opt.color, backgroundColor: `${opt.color}10` }
              ]}
              onPress={() => setType(opt.type)}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${opt.color}20` }]}>
                <Ionicons name={opt.icon} size={24} color={opt.color} />
              </View>
              <Text style={[styles.goalLabel, type === opt.type && { color: opt.color }]}>
                {GOAL_LABELS[opt.type]}
              </Text>
              <Text style={styles.goalDesc}>{opt.description}</Text>
              {type === opt.type && (
                <View style={[styles.checkCircle, { backgroundColor: opt.color }]}>
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {type !== 'maintain' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TARGET WEIGHT (KG)</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.weightInput}
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor="#4b5563"
              />
            </View>
          </View>
        )}

        {(type === 'weight_loss' || type === 'weight_gain') && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WEEKLY RATE (KG/WEEK)</Text>
            <View style={styles.segmentedControl}>
              {RATES.map((rate) => (
                <Pressable 
                  key={rate} 
                  style={[styles.segment, weeklyRate === rate && styles.segmentActive]}
                  onPress={() => setWeeklyRate(rate)}
                >
                  <Text style={[styles.segmentText, weeklyRate === rate && styles.segmentTextActive]}>
                    {rate}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.rateHint}>
              Recommended: 0.5 kg/week for sustainable results.
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.bottomSaveBtn}
          onPress={handleSave}
        >
          <Text style={styles.bottomSaveBtnText}>Save Goal</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  scrollContent: {
    padding: 20,
  },
  saveBtn: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: '48%',
    backgroundColor: '#1e2126',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2a2d35',
    position: 'relative',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  goalDesc: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  checkCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputCard: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  weightInput: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1e2126',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: '#8b5cf6',
  },
  segmentText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  rateHint: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSaveBtn: {
    backgroundColor: '#8b5cf6',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSaveBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
