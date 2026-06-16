import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateStrip from '../../components/journal/DateStrip';
import DailyMacroSummary from '../../components/journal/DailyMacroSummary';
import MealSection, { MealData } from '../../components/journal/MealSection';
import WaterTracker from '../../components/dashboard/WaterTracker';
import AddFoodModal from '../../components/journal/AddFoodModal';
import { useSettings } from '../../contexts/SettingsContext';
import { useFoodLogs } from '../../hooks/useFoodLogs';
import { useDailyLogs } from '../../hooks/useDailyLogs';
import { useThemeColors } from '../../types/theme';

export default function JournalScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const mealPositions = useRef<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addingFoodToMeal, setAddingFoodToMeal] = useState<{id: string, name: string} | null>(null);
  const { settings } = useSettings();
  const colors = useThemeColors();

  // Handle navigation from Dashboard
  useEffect(() => {
    if (params.selectedMealId) {
      const mealId = params.selectedMealId as string;
      const meal = settings.meals.find(m => m.id === mealId);
      if (meal) {
        setSelectedDate(new Date()); // Ensure we are on "Today"
        
        // Wait a bit for layout to settle, then scroll
        setTimeout(() => {
          const y = mealPositions.current[mealId];
          if (y !== undefined && scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y, animated: true });
          }
        }, 100);
        
        // Clear the param
        router.setParams({ selectedMealId: '' });
      }
    }
  }, [params.selectedMealId, settings.meals, router]);
  
  // Format date as YYYY-MM-DD local time to avoid timezone shifts
  const dateStr = useMemo(() => {
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const { logs, addFoodLog, updateFoodLog, deleteFoodLog } = useFoodLogs(dateStr);
  const { waterGlasses, setWaterGlasses } = useDailyLogs(dateStr);
  const [editingFoodItem, setEditingFoodItem] = useState<any | null>(null);

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

  // Build meals from settings, overlaying actual food items
  const meals: MealData[] = settings.meals
    .filter((m) => m.enabled)
    .map((slot) => ({
      id: slot.id,
      name: slot.name,
      icon: slot.icon as any,
      items: logsByMeal[slot.id] ?? [],
    }));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Date strip - fixed at top */}
      <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily macro summary */}
        <DailyMacroSummary
          calories={macros.calories}
          protein={macros.protein}
          carbs={macros.carbs}
          fat={macros.fat}
        />

        {/* Meal sections */}
        <View style={styles.mealsContainer}>
          {meals.map((meal) => (
            <View 
              key={meal.id} 
              onLayout={(e) => {
                mealPositions.current[meal.id] = e.nativeEvent.layout.y;
              }}
            >
              <MealSection
                meal={meal}
                onAddFood={() => setAddingFoodToMeal({ id: meal.id, name: meal.name })}
                onEditFood={(item) => {
                  setEditingFoodItem(item);
                  setAddingFoodToMeal({ id: meal.id, name: meal.name });
                }}
              />
            </View>
          ))}
        </View>

        {/* Water intake */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <WaterTracker
            glasses={waterGlasses}
            onGlassesChange={setWaterGlasses}
            goal={settings.dailyGoals.waterGlasses}
          />
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add/Edit Food Modal */}
      <AddFoodModal
        visible={addingFoodToMeal !== null}
        mealName={addingFoodToMeal?.name ?? ''}
        initialData={editingFoodItem}
        onClose={() => {
          setAddingFoodToMeal(null);
          setEditingFoodItem(null);
        }}
        onDelete={(id) => deleteFoodLog(id)}
        onSave={(food) => {
          if (addingFoodToMeal) {
            if (editingFoodItem) {
              updateFoodLog(editingFoodItem.id, {
                meal_id: addingFoodToMeal.id,
                date: dateStr,
                ...food
              });
            } else {
              addFoodLog({
                meal_id: addingFoodToMeal.id,
                date: dateStr,
                ...food
              });
            }
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  mealsContainer: {
    gap: 12,
    marginTop: 16,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
  },
  bottomSpacer: {
    height: 30,
  },
});
