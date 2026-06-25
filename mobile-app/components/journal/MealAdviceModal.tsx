import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../types/theme';

interface MealAdviceModalProps {
  visible: boolean;
  onClose: () => void;
  mealName: string;
  loading: boolean;
  error: string | null;
  advice: string | null;
  mealSummary: {
    item_count: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fats_g: number;
    meal_calories: number;
  } | null;
  dayContext: {
    meal_type: string;
    dietary_goal: string;
    consumed_before: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
    targets: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      planned_meals_count: number;
    };
  } | null;
}

export default function MealAdviceModal({
  visible,
  onClose,
  mealName,
  loading,
  error,
  advice,
  mealSummary,
  dayContext,
}: MealAdviceModalProps) {
  const theme = useThemeColors();

  const getPercent = (value: number, target: number) => {
    if (!target) return 0;
    return Math.min(Math.round((value / target) * 100), 100);
  };

  const getGoalLabel = (goal: string) => {
    switch (goal.toLowerCase()) {
      case 'weight_loss':
        return 'Weight Loss';
      case 'weight_gain':
        return 'Muscle Gain';
      case 'maintain':
        return 'Maintenance';
      default:
        return goal.charAt(0).toUpperCase() + goal.slice(1);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.content, { backgroundColor: theme.cardBg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.aiIconCircle}>
                <Ionicons name="sparkles" size={18} color="#c77ffb" />
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>AI advice • {mealName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#c77ffb" />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Analyzing your meal against daily goals...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
              <Text style={[styles.errorText, { color: theme.textSecondary }]}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.retryBtn, { backgroundColor: theme.border }]}
              >
                <Text style={[styles.retryBtnText, { color: theme.textPrimary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {/* Advice Paragraph */}
              <View style={[styles.adviceCard, { backgroundColor: 'rgba(199, 127, 251, 0.08)', borderColor: 'rgba(199, 127, 251, 0.15)' }]}>
                <Text style={[styles.adviceText, { color: theme.textSecondary }]}>
                  {advice}
                </Text>
              </View>

              {dayContext && mealSummary && (
                <>
                  {/* Context stats card */}
                  <View style={[styles.statsCard, { borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Day Progress Context</Text>
                    
                    <View style={styles.contextRow}>
                      <View style={styles.contextCol}>
                        <Text style={[styles.contextLabel, { color: theme.textDim }]}>Dietary Goal</Text>
                        <Text style={[styles.contextVal, { color: theme.textSecondary }]}>
                          {getGoalLabel(dayContext.dietary_goal)}
                        </Text>
                      </View>
                      <View style={styles.contextDivider} />
                      <View style={styles.contextCol}>
                        <Text style={[styles.contextLabel, { color: theme.textDim }]}>Daily Meal Plan</Text>
                        <Text style={[styles.contextVal, { color: theme.textSecondary }]}>
                          {dayContext.targets.planned_meals_count} meals planned
                        </Text>
                      </View>
                    </View>

                    {/* Calorie Contribution Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressLabelRow}>
                        <Text style={[styles.progressName, { color: theme.textSecondary }]}>Calories (kcal)</Text>
                        <Text style={[styles.progressValText, { color: theme.textPrimary }]}>
                          {mealSummary.meal_calories} / {dayContext.targets.calories} kcal ({getPercent(mealSummary.meal_calories, dayContext.targets.calories)}%)
                        </Text>
                      </View>
                      <View style={[styles.progressBarBg, { backgroundColor: theme.inputBg }]}>
                        {/* Consumed Before (gray/dim) */}
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: theme.textDim,
                              width: `${getPercent(dayContext.consumed_before.calories, dayContext.targets.calories)}%`,
                            },
                          ]}
                        />
                        {/* Current Meal (purple/accent) */}
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: '#c77ffb',
                              width: `${getPercent(mealSummary.meal_calories, dayContext.targets.calories)}%`,
                              marginLeft: `${getPercent(dayContext.consumed_before.calories, dayContext.targets.calories)}%`,
                              position: 'absolute',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressSubtext, { color: theme.textDim }]}>
                        Consumed before: {dayContext.consumed_before.calories} kcal • This meal: {mealSummary.meal_calories} kcal
                      </Text>
                    </View>
                  </View>

                  {/* Macros breakdown visual */}
                  <View style={[styles.statsCard, { borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Meal Macro Contribution</Text>

                    {/* Protein bar */}
                    <View style={styles.macroProgressItem}>
                      <View style={styles.progressLabelRow}>
                        <Text style={[styles.macroLabel, { color: theme.textSecondary }]}>Protein (g)</Text>
                        <Text style={[styles.macroVal, { color: theme.textPrimary }]}>
                          {mealSummary.total_protein_g}g / {dayContext.targets.protein}g ({getPercent(mealSummary.total_protein_g, dayContext.targets.protein)}%)
                        </Text>
                      </View>
                      <View style={[styles.progressBarBg, { backgroundColor: theme.inputBg }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: '#38bdf8',
                              width: `${getPercent(mealSummary.total_protein_g, dayContext.targets.protein)}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Carbs bar */}
                    <View style={styles.macroProgressItem}>
                      <View style={styles.progressLabelRow}>
                        <Text style={[styles.macroLabel, { color: theme.textSecondary }]}>Carbs (g)</Text>
                        <Text style={[styles.macroVal, { color: theme.textPrimary }]}>
                          {mealSummary.total_carbs_g}g / {dayContext.targets.carbs}g ({getPercent(mealSummary.total_carbs_g, dayContext.targets.carbs)}%)
                        </Text>
                      </View>
                      <View style={[styles.progressBarBg, { backgroundColor: theme.inputBg }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: '#facc15',
                              width: `${getPercent(mealSummary.total_carbs_g, dayContext.targets.carbs)}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Fats bar */}
                    <View style={styles.macroProgressItem}>
                      <View style={styles.progressLabelRow}>
                        <Text style={[styles.macroLabel, { color: theme.textSecondary }]}>Fats (g)</Text>
                        <Text style={[styles.macroVal, { color: theme.textPrimary }]}>
                          {mealSummary.total_fats_g}g / {dayContext.targets.fats}g ({getPercent(mealSummary.total_fats_g, dayContext.targets.fats)}%)
                        </Text>
                      </View>
                      <View style={[styles.progressBarBg, { backgroundColor: theme.inputBg }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: '#f87171',
                              width: `${getPercent(mealSummary.total_fats_g, dayContext.targets.fats)}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                onPress={onClose}
                style={[styles.dismissBtn, { backgroundColor: '#c77ffb' }]}
              >
                <Text style={styles.dismissBtnText}>Understood</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(199, 127, 251, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  errorContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 20,
  },
  adviceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  adviceText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  contextCol: {
    flex: 1,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contextVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  contextDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginHorizontal: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressName: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressValText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
  },
  macroProgressItem: {
    marginBottom: 12,
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  macroVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  dismissBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  dismissBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
