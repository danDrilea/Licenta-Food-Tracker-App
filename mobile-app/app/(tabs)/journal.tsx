import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Alert, Modal, Text, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateStrip from '../../components/journal/DateStrip';
import DailyMacroSummary from '../../components/journal/DailyMacroSummary';
import MealSection, { MealData } from '../../components/journal/MealSection';
import WaterTracker from '../../components/dashboard/WaterTracker';
import AddFoodModal from '../../components/journal/AddFoodModal';
import ScanPhotoFlowModal from '../../components/journal/ScanPhotoFlowModal';
import { useSettings } from '../../contexts/SettingsContext';
import { useFoodLogs, FoodEntry } from '../../hooks/useFoodLogs';
import { useDailyLogs } from '../../hooks/useDailyLogs';
import { useProfile } from '../../hooks/useProfile';
import { useThemeColors } from '../../types/theme';
import { getLocalDateStr, cleanServerUrl } from '../../types/utils';

export default function JournalScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const mealPositions = useRef<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addingFoodToMeal, setAddingFoodToMeal] = useState<{ id: string, name: string } | null>(null);
  const [photoScannerVisible, setPhotoScannerVisible] = useState(false);
  const { settings } = useSettings();
  const { profile } = useProfile();
  const colors = useThemeColors();

  // AI Advice States
  const [mealAdvices, setMealAdvices] = useState<Record<string, string>>({});
  const [adviceLoading, setAdviceLoading] = useState(false);

  // Clear AI Advice when a meal is modified
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('food_logs_changed', () => {
      setMealAdvices({});
    });
    return () => subscription.remove();
  }, []);

  const handleAnalyzeMeal = async (meal: MealData) => {
    if (meal.items.length === 0) {
      Alert.alert(
        'No Food Logged',
        'Please add some food items to this meal before requesting AI Advice!'
      );
      return;
    }

    setAdviceLoading(true);

    try {
      const items = meal.items.map(item => {
        const amountStr = item.amount || '';
        const match = amountStr.match(/(\d+(?:\.\d+)?)\s*g/i);
        let grams = 100.0;
        if (match) {
          grams = parseFloat(match[1]);
        } else {
          const fallbackMatch = amountStr.match(/(\d+(?:\.\d+)?)/);
          if (fallbackMatch) {
            grams = parseFloat(fallbackMatch[1]);
          }
        }

        return {
          name: item.name,
          grams: grams,
          protein: item.protein ?? 0.0,
          carbs: item.carbs ?? 0.0,
          fats: item.fat ?? 0.0,
          calories: item.calories
        };
      });

      const mealCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);

      const consumedBefore = logs.reduce((acc, log) => {
        if (log.meal_id !== meal.id) {
          acc.calories += log.calories;
          acc.protein += log.protein;
          acc.carbs += log.carbs;
          acc.fats += log.fat;
        }
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

      const plannedMealsCount = settings.meals.filter(m => m.enabled).length;
      const dietaryGoal = profile?.goal?.type || 'maintenance';

      const payload = {
        items,
        target_calories: settings.dailyGoals.calories,
        target_protein: settings.dailyGoals.protein,
        target_carbs: settings.dailyGoals.carbs,
        target_fats: settings.dailyGoals.fat,
        meal_calories: mealCalories,
        planned_meals_count: plannedMealsCount,
        meal_type: meal.name,
        dietary_goal: dietaryGoal,
        consumed_calories_before: consumedBefore.calories,
        consumed_protein_before: consumedBefore.protein,
        consumed_carbs_before: consumedBefore.carbs,
        consumed_fats_before: consumedBefore.fats,
      };

      const baseUrl = settings.rpiServerUrl || 'http://danalrpi.local:8000';
      const cleanUrl = cleanServerUrl(baseUrl);

      console.log('AI Advice Request Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${cleanUrl}/meal-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status}`);
      }

      const result = await response.json();
      console.log('AI Advice Response Result:', JSON.stringify(result, null, 2));

      if (result.status === 'success') {
        setMealAdvices(prev => ({
          ...prev,
          [meal.id]: result.advice
        }));
      } else {
        throw new Error(result.message || 'Failed to get advice');
      }
    } catch (err: any) {
      console.error('API Error:', err);
      Alert.alert(
        'AI Advice Error',
        err.message || 'Cannot connect to Raspberry Pi server. Please check your network and settings.'
      );
    } finally {
      setAdviceLoading(false);
    }
  };

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
  const dateStr = useMemo(() => getLocalDateStr(selectedDate), [selectedDate]);

  const { logs, addFoodLog, updateFoodLog, deleteFoodLog } = useFoodLogs(dateStr);
  const { waterGlasses, setWaterGlasses } = useDailyLogs(dateStr);
  const [editingFoodItem, setEditingFoodItem] = useState<FoodEntry | null>(null);

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
    const raw = logs.reduce((acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return {
      calories: Math.round(raw.calories || 0),
      protein: Math.round(raw.protein || 0),
      carbs: Math.round(raw.carbs || 0),
      fat: Math.round(raw.fat || 0),
    };
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
                onAnalyzeMeal={handleAnalyzeMeal}
                advice={mealAdvices[meal.id]}
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
        onLaunchPhotoScanner={() => setPhotoScannerVisible(true)}
        userCountry={settings.country}
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

      {/* AI Photo Flow Modal */}
      <ScanPhotoFlowModal
        visible={photoScannerVisible}
        onClose={() => setPhotoScannerVisible(false)}
      />

      {/* AI Advice Waiting Modal Overlay */}
      <Modal visible={adviceLoading} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.cardBg, padding: 24, borderRadius: 16, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border }}>
            <ActivityIndicator size="large" color="#c77ffb" />
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>AI is thinking...</Text>
          </View>
        </View>
      </Modal>
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
