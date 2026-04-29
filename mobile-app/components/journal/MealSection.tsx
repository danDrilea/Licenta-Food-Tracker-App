import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  amount: string; // e.g. "150g", "1 cup"
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface MealData {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: FoodItem[];
}

interface MealSectionProps {
  meal: MealData;
  onAddFood?: () => void;
}

export default function MealSection({ meal, onAddFood }: MealSectionProps) {
  const totalCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);
  const hasItems = meal.items.length > 0;

  return (
    <View style={styles.container}>
      {/* Meal header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name={meal.icon} size={18} color="#c77ffb" />
          </View>
          <Text style={styles.mealName}>{meal.name}</Text>
        </View>

        <Text style={styles.totalCal}>
          {hasItems ? `${totalCalories} kcal` : ''}
        </Text>
      </View>

      {/* Food items */}
      {hasItems ? (
        <View style={styles.itemsList}>
          {meal.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.foodItem,
                index < meal.items.length - 1 && styles.foodItemBorder,
              ]}
            >
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodAmount}>{item.amount}</Text>
              </View>
              <View style={styles.foodRight}>
                <Text style={styles.foodCalories}>{item.calories}</Text>
                <Text style={styles.foodCalUnit}>kcal</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No food logged</Text>
        </View>
      )}

      {/* Add food button */}
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed,
        ]}
        onPress={onAddFood}
      >
        <Ionicons name="add-circle-outline" size={18} color="#8b5cf6" />
        <Text style={styles.addButtonText}>Add food</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  totalCal: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  itemsList: {
    paddingHorizontal: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 44, // aligns with text after icon
  },
  foodItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d35',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '500',
  },
  foodAmount: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  foodRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  foodCalories: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  foodCalUnit: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 8,
    paddingLeft: 60,
  },
  emptyText: {
    color: '#4b5563',
    fontSize: 13,
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2d35',
  },
  addButtonPressed: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  addButtonText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '600',
  },
});
