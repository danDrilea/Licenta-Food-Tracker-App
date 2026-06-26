import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProfile } from '../hooks/useProfile';
import { GOAL_LABELS, UserGoal, GoalType } from '../types/profile';
import { useThemeColors } from '../types/theme';

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
  const theme = useThemeColors();

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const goal: UserGoal = {
      type,
      targetWeight: type !== 'maintain' ? parseFloat(targetWeight) || 70 : undefined,
      weeklyRate: (type === 'weight_loss' || type === 'weight_gain') ? weeklyRate : undefined,
    };

    await updateGoal(goal);
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{
        title: 'Fitness Goal',
        headerStyle: { backgroundColor: theme.cardBg },
        headerTintColor: theme.textPrimary,
        headerLeft: () => (
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>CHOOSE YOUR GOAL</Text>
        <View style={styles.grid}>
          {GOAL_OPTIONS.map((opt) => (
            <Pressable 
              key={opt.type} 
              style={[
                styles.goalCard, 
                { backgroundColor: theme.cardBg, borderColor: theme.border },
                type === opt.type && { borderColor: opt.color, backgroundColor: `${opt.color}10` }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setType(opt.type);
              }}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${opt.color}20` }]}>
                <Ionicons name={opt.icon} size={24} color={opt.color} />
              </View>
              <Text style={[styles.goalLabel, { color: theme.textPrimary }, type === opt.type && { color: opt.color }]}>
                {GOAL_LABELS[opt.type]}
              </Text>
              <Text style={[styles.goalDesc, { color: theme.textDim }]}>{opt.description}</Text>
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
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>TARGET WEIGHT (KG)</Text>
            <View style={[styles.inputCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <TextInput
                style={[styles.weightInput, { color: theme.textPrimary }]}
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={theme.textDimmer}
              />
            </View>
          </View>
        )}

        {(type === 'weight_loss' || type === 'weight_gain') && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>WEEKLY RATE (KG/WEEK)</Text>
            <View style={[styles.segmentedControl, { backgroundColor: theme.cardBg }]}>
              {RATES.map((rate) => (
                <Pressable 
                  key={rate} 
                  style={[styles.segment, weeklyRate === rate && styles.segmentActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setWeeklyRate(rate);
                  }}
                >
                  <Text style={[styles.segmentText, { color: theme.textMuted }, weeklyRate === rate && styles.segmentTextActive]}>
                    {rate}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.rateHint, { color: theme.textDim }]}>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
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
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
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
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  goalDesc: {
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  weightInput: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
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
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  rateHint: {
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
