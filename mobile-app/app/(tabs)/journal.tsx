import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import DateStrip from '../../components/journal/DateStrip';
import DailyMacroSummary from '../../components/journal/DailyMacroSummary';
import MealSection, { MealData } from '../../components/journal/MealSection';
import WaterTracker from '../../components/dashboard/WaterTracker';
import { useSettings } from '../../contexts/SettingsContext';
import { useDailyData } from '../../contexts/DailyDataContext';

// Mock food items keyed by meal slot id (will come from real food log later)
const MOCK_FOOD_ITEMS: Record<string, MealData['items']> = {
  breakfast: [
    { id: 'b1', name: 'Greek Yogurt', calories: 150, amount: '200g', protein: 18, carbs: 8, fat: 5 },
    { id: 'b2', name: 'Granola', calories: 180, amount: '40g', protein: 4, carbs: 28, fat: 6 },
    { id: 'b3', name: 'Banana', calories: 90, amount: '1 medium', protein: 1, carbs: 23, fat: 0 },
  ],
  lunch: [
    { id: 'l1', name: 'Grilled Chicken Breast', calories: 280, amount: '200g', protein: 52, carbs: 0, fat: 6 },
    { id: 'l2', name: 'Brown Rice', calories: 215, amount: '150g', protein: 5, carbs: 45, fat: 2 },
    { id: 'l3', name: 'Mixed Salad', calories: 85, amount: '1 bowl', protein: 3, carbs: 12, fat: 3 },
    { id: 'l4', name: 'Olive Oil Dressing', calories: 70, amount: '1 tbsp', protein: 0, carbs: 0, fat: 8 },
  ],
  dinner: [
    { id: 'd1', name: 'Salmon Fillet', calories: 250, amount: '150g', protein: 34, carbs: 0, fat: 12 },
    { id: 'd2', name: 'Sweet Potatoes', calories: 130, amount: '180g', protein: 2, carbs: 30, fat: 0 },
  ],
};

const MOCK_MACROS = {
  calories: { consumed: 1450, goal: 2100 },
  protein: { consumed: 119, goal: 140 },
  carbs: { consumed: 146, goal: 250 },
  fat: { consumed: 42, goal: 70 },
};

export default function JournalScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { settings } = useSettings();
  const dailyData = useDailyData();

  // Build meals from settings, overlaying mock food items
  const meals: MealData[] = settings.meals
    .filter((m) => m.enabled)
    .map((slot) => ({
      id: slot.id,
      name: slot.name,
      icon: slot.icon as any,
      items: MOCK_FOOD_ITEMS[slot.id] ?? [],
    }));

  return (
    <View style={styles.screen}>
      {/* Date strip - fixed at top */}
      <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily macro summary */}
        <DailyMacroSummary
          calories={MOCK_MACROS.calories}
          protein={MOCK_MACROS.protein}
          carbs={MOCK_MACROS.carbs}
          fat={MOCK_MACROS.fat}
        />

        {/* Meal sections */}
        <View style={styles.mealsContainer}>
          {meals.map((meal) => (
            <MealSection
              key={meal.id}
              meal={meal}
              onAddFood={() => console.log(`Add food to ${meal.name}`)}
            />
          ))}
        </View>

        {/* Water intake */}
        <View style={styles.card}>
          <WaterTracker
            glasses={dailyData.waterGlasses}
            onGlassesChange={dailyData.setWaterGlasses}
            goal={settings.dailyGoals.waterGlasses}
          />
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#25292e',
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
    backgroundColor: '#1e2126',
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  bottomSpacer: {
    height: 30,
  },
});
