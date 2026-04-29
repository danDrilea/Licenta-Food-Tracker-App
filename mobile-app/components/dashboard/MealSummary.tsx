import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export interface DashboardMealData {
  id: string;
  name: string;
  calories: number | null;
  items: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface MealSummaryProps {
  meals: DashboardMealData[];
  onMealPress?: (meal: DashboardMealData) => void;
}

export const MAX_MEALS = 8;

// Default icons for known meal names, fallback for custom ones
const DEFAULT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Breakfast: 'sunny-outline',
  Lunch: 'restaurant-outline',
  Dinner: 'moon-outline',
  Snacks: 'cafe-outline',
};

const CUSTOM_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'nutrition-outline',
  'pizza-outline',
  'ice-cream-outline',
  'beer-outline',
];

function getMealIcon(meal: DashboardMealData, index: number): keyof typeof Ionicons.glyphMap {
  if (meal.icon) return meal.icon;
  if (DEFAULT_ICONS[meal.name]) return DEFAULT_ICONS[meal.name];
  return CUSTOM_ICONS[index % CUSTOM_ICONS.length] || 'fast-food-outline';
}

export default function MealSummary({ meals, onMealPress }: MealSummaryProps) {
  // Enforce max meals
  const displayMeals = meals.slice(0, MAX_MEALS);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        <Text style={styles.mealCount}>{displayMeals.length} meals</Text>
      </View>

      <View style={styles.grid}>
        {displayMeals.map((meal, index) => {
          const isLogged = meal.calories !== null && meal.items > 0;
          const icon = getMealIcon(meal, index);

          return (
            <Pressable
              key={meal.id}
              style={({ pressed }) => [
                styles.card,
                !isLogged && styles.cardEmpty,
                pressed && styles.cardPressed,
              ]}
              onPress={() => {
                console.log(`Meal pressed: ${meal.name} (id: ${meal.id})`);
                onMealPress?.(meal);
              }}
            >
              <View style={[styles.iconCircle, !isLogged && styles.iconCircleEmpty]}>
                <Ionicons
                  name={icon}
                  size={20}
                  color={isLogged ? '#c77ffb' : '#4b5563'}
                />
              </View>

              <Text
                style={[styles.mealName, !isLogged && styles.textMuted]}
                numberOfLines={1}
              >
                {meal.name}
              </Text>

              {isLogged ? (
                <>
                  <Text style={styles.calories}>{meal.calories} kcal</Text>
                  <Text style={styles.itemCount}>
                    {meal.items} {meal.items === 1 ? 'item' : 'items'}
                  </Text>
                </>
              ) : (
                <Text style={styles.notLogged}>Not logged</Text>
              )}
            </Pressable>
          );
        })}
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
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  mealCount: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#1e2126',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  cardEmpty: {
    borderColor: '#1e2126',
    opacity: 0.6,
  },
  cardPressed: {
    backgroundColor: '#2a2d35',
    opacity: 1,
    transform: [{ scale: 0.97 }],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircleEmpty: {
    backgroundColor: 'rgba(75, 85, 99, 0.15)',
  },
  mealName: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  textMuted: {
    color: '#6b7280',
  },
  calories: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  itemCount: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  notLogged: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
