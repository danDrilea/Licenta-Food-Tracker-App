import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import CalorieRing from '../../components/dashboard/CalorieRing';
import MacroBreakdown from '../../components/dashboard/MacroBreakdown';
import WaterTracker from '../../components/dashboard/WaterTracker';
import MealSummary from '../../components/dashboard/MealSummary';
import StreakCounter from '../../components/dashboard/StreakCounter';
import WeeklyChart from '../../components/dashboard/WeeklyChart';
import { useSettings } from '../../contexts/SettingsContext';
import { useFoodLogs } from '../../hooks/useFoodLogs';
import { useDailyLogs } from '../../hooks/useDailyLogs';
import { useWeeklyStats } from '../../hooks/useWeeklyStats';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../types/theme';
import type { DashboardMealData } from '../../components/dashboard/MealSummary';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function DashboardScreen() {
  const { settings } = useSettings();
  const router = useRouter();
  const colors = useThemeColors();
  
  // Format today's date local time
  const todayStr = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }, []);

  const { logs } = useFoodLogs(todayStr);
  const { waterGlasses, setWaterGlasses } = useDailyLogs(todayStr);
  const { weeklyCalories, streak, isFrozen } = useWeeklyStats();

  // Group logs by meal_id
  const logsByMeal = useMemo(() => {
    const grouped: Record<string, typeof logs> = {};
    logs.forEach(log => {
      if (!grouped[log.meal_id]) grouped[log.meal_id] = [];
      grouped[log.meal_id].push(log);
    });
    return grouped;
  }, [logs]);

  // Calculate daily totals
  const totals = useMemo(() => {
    return logs.reduce((acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [logs]);

  // Build macros prop
  const macros = {
    calories: { consumed: totals.calories, goal: settings.dailyGoals.calories },
    protein: { consumed: totals.protein, goal: settings.dailyGoals.protein },
    carbs: { consumed: totals.carbs, goal: settings.dailyGoals.carbs },
    fat: { consumed: totals.fat, goal: settings.dailyGoals.fat },
  };

  // Build meals from settings, overlaying actual calorie data
  const meals: DashboardMealData[] = settings.meals
    .filter((m) => m.enabled)
    .map((slot) => {
      const mealLogs = logsByMeal[slot.id] || [];
      const calories = mealLogs.reduce((sum, log) => sum + log.calories, 0);
      return {
        id: slot.id,
        name: slot.name,
        icon: slot.icon as any,
        calories: calories > 0 ? calories : null,
        items: mealLogs.length,
      };
    });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.textPrimary }]}>{getGreeting()} 👋</Text>
        <Text style={[styles.date, { color: colors.textMuted }]}>{getFormattedDate()}</Text>
      </View>

      {/* ─── 1. Calorie Ring ─── */}
      <View style={styles.section}>
        <CalorieRing
          consumed={macros.calories.consumed}
          goal={macros.calories.goal}
        />
      </View>

      {/* ─── Streak ─── */}
      <View style={styles.section}>
        <StreakCounter days={streak} isFrozen={isFrozen} />
      </View>

      {/* ─── 2. Macronutrients ─── */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <MacroBreakdown
          protein={macros.protein}
          carbs={macros.carbs}
          fat={macros.fat}
        />
      </View>

      {/* ─── 3. Today's Meals ─── */}
      <View style={styles.section}>
        <MealSummary
          meals={meals}
          onMealPress={(meal) => {
            router.push({ pathname: '/journal', params: { selectedMealId: meal.id } });
          }}
        />
      </View>

      {/* ─── 4. Water Intake ─── */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <WaterTracker
          glasses={waterGlasses}
          onGlassesChange={setWaterGlasses}
          goal={settings.dailyGoals.waterGlasses}
        />
      </View>


      {/* ─── 6. Weekly Overview ─── */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <WeeklyChart
          data={weeklyCalories}
          goal={macros.calories.goal}
        />
      </View>

      {/* Bottom spacer for tab bar */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  section: {
    marginVertical: 10,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginVertical: 10,
    borderWidth: 1,
  },
  bottomSpacer: {
    height: 30,
  },
});
