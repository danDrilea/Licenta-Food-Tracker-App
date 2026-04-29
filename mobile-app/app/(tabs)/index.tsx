import { StyleSheet, Text, View, ScrollView } from 'react-native';
import CalorieRing from '../../components/dashboard/CalorieRing';
import MacroBreakdown from '../../components/dashboard/MacroBreakdown';
import WaterTracker from '../../components/dashboard/WaterTracker';
import MealSummary from '../../components/dashboard/MealSummary';
import StreakCounter from '../../components/dashboard/StreakCounter';
import WeeklyChart from '../../components/dashboard/WeeklyChart';

// ─── Mock data (will be replaced with real state/API later) ─────────
const MOCK = {
  calories: { consumed: 1450, goal: 2100 },
  macros: {
    protein: { consumed: 85, goal: 140 },
    carbs: { consumed: 160, goal: 250 },
    fat: { consumed: 45, goal: 70 },
  },
  water: { glasses: 5, goal: 8 },
  meals: [
    { id: 'breakfast', name: 'Breakfast', calories: 420, items: 3 },
    { id: 'lunch', name: 'Lunch', calories: 650, items: 4 },
    { id: 'dinner', name: 'Dinner', calories: 380, items: 2 },
    { id: 'snacks', name: 'Snacks', calories: null, items: 0 },
  ],
  streak: 7,
  weeklyCalories: [1950, 2100, 1800, 2250, 1450, 0, 0],
};

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
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()} 👋</Text>
        <Text style={styles.date}>{getFormattedDate()}</Text>
      </View>

      {/* ─── 1. Calorie Ring ─── */}
      <View style={styles.section}>
        <CalorieRing
          consumed={MOCK.calories.consumed}
          goal={MOCK.calories.goal}
        />
      </View>

      {/* ─── 2. Macronutrients ─── */}
      <View style={styles.card}>
        <MacroBreakdown
          protein={MOCK.macros.protein}
          carbs={MOCK.macros.carbs}
          fat={MOCK.macros.fat}
        />
      </View>

      {/* ─── 3. Today's Meals ─── */}
      <View style={styles.section}>
        <MealSummary
          meals={MOCK.meals}
          onMealPress={(meal) => {
            // TODO: navigate to journal tab with this meal focused
            console.log(`Navigate to journal → ${meal.name} (id: ${meal.id})`);
          }}
        />
      </View>

      {/* ─── 4. Water Intake ─── */}
      <View style={styles.card}>
        <WaterTracker
          initialGlasses={MOCK.water.glasses}
          goal={MOCK.water.goal}
        />
      </View>

      {/* ─── 5. Streak ─── */}
      <View style={styles.section}>
        <StreakCounter days={MOCK.streak} />
      </View>

      {/* ─── 6. Weekly Overview ─── */}
      <View style={styles.card}>
        <WeeklyChart
          data={MOCK.weeklyCalories}
          goal={MOCK.calories.goal}
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
    backgroundColor: '#25292e',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 8,
  },
  greeting: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  date: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  section: {
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    padding: 18,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  bottomSpacer: {
    height: 30,
  },
});
