import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface MealData {
  name: string;
  calories: number | null;
  items: number;
}

interface MealSummaryProps {
  meals: MealData[];
}

const MEAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Breakfast: 'sunny-outline',
  Lunch: 'restaurant-outline',
  Dinner: 'moon-outline',
  Snacks: 'cafe-outline',
};

export default function MealSummary({ meals }: MealSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Meals</Text>

      <View style={styles.grid}>
        {meals.map((meal) => {
          const isLogged = meal.calories !== null && meal.items > 0;
          const icon = MEAL_ICONS[meal.name] || 'fast-food-outline';

          return (
            <View
              key={meal.name}
              style={[styles.card, !isLogged && styles.cardEmpty]}
            >
              <View style={[styles.iconCircle, !isLogged && styles.iconCircleEmpty]}>
                <Ionicons
                  name={icon}
                  size={20}
                  color={isLogged ? '#c77ffb' : '#4b5563'}
                />
              </View>

              <Text style={[styles.mealName, !isLogged && styles.textMuted]}>
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
            </View>
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
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: '45%',
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
