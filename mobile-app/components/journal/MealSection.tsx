import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../../types/theme';

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
  onEditFood?: (item: FoodItem) => void;
  onAnalyzeMeal?: (meal: MealData) => void;
  advice?: string | null;
}

export default function MealSection({ meal, onAddFood, onEditFood, onAnalyzeMeal, advice }: MealSectionProps) {
  const totalCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);
  const hasItems = meal.items.length > 0;
  const theme = useThemeColors();
  const [isAdviceCollapsed, setIsAdviceCollapsed] = useState(false);

  // Auto-expand advice when new advice arrives
  useEffect(() => {
    if (advice) {
      setIsAdviceCollapsed(false);
    }
  }, [advice]);

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      {/* Meal header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name={meal.icon} size={18} color="#c77ffb" />
          </View>
          <Text style={[styles.mealName, { color: theme.textPrimary }]}>{meal.name}</Text>
        </View>

        <Text style={[styles.totalCal, { color: theme.textMuted }]}>
          {hasItems ? `${totalCalories} kcal` : ''}
        </Text>
      </View>

      {/* Food items */}
      {hasItems ? (
        <View style={styles.itemsList}>
          {meal.items.map((item, index) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.foodItem,
                index < meal.items.length - 1 && [styles.foodItemBorder, { borderBottomColor: theme.border }],
                pressed && styles.foodItemPressed,
              ]}
              onPress={() => onEditFood?.(item)}
            >
              <View style={styles.foodInfo}>
                <Text style={[styles.foodName, { color: theme.textSecondary }]}>{item.name}</Text>
                <Text style={[styles.foodAmount, { color: theme.textDim }]}>{item.amount}</Text>
              </View>
              <View style={styles.foodRight}>
                <View style={styles.calCol}>
                  <Text style={[styles.foodCalories, { color: theme.textPrimary }]}>{item.calories}</Text>
                  <Text style={[styles.foodCalUnit, { color: theme.textDim }]}>kcal</Text>
                </View>
                <Ionicons name="create-outline" size={16} color="#c77ffb" style={styles.editIcon} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.textDimmer }]}>No food logged</Text>
        </View>
      )}

      {/* Bottom action row */}
      <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={onAddFood}
        >
          <Ionicons name="add-circle-outline" size={18} color="#8b5cf6" />
          <Text style={[styles.actionButtonText, { color: '#8b5cf6' }]}>Add food</Text>
        </Pressable>

        {onAnalyzeMeal && (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => onAnalyzeMeal(meal)}
            >
              <Ionicons name="sparkles-outline" size={18} color="#c77ffb" />
              <Text style={[styles.actionButtonText, { color: '#c77ffb' }]}>AI Advice</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Advice container inside card */}
      {advice && (
        <View style={[styles.adviceContainer, { backgroundColor: 'rgba(199, 127, 251, 0.06)', borderTopColor: theme.border }]}>
          <Pressable
            onPress={() => setIsAdviceCollapsed(!isAdviceCollapsed)}
            style={({ pressed }) => [
              styles.adviceHeader,
              isAdviceCollapsed && { marginBottom: 0 },
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="sparkles" size={14} color="#c77ffb" />
            <Text style={[styles.adviceTitle, { color: theme.textPrimary }]}>AI advice</Text>
            <View style={{ flex: 1 }} />
            <Ionicons 
              name={isAdviceCollapsed ? "chevron-down-outline" : "chevron-up-outline"} 
              size={18} 
              color="#c77ffb" 
            />
          </Pressable>
          {!isAdviceCollapsed && (
            <Text style={[styles.adviceText, { color: theme.textSecondary }]}>{advice}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: '700',
  },
  totalCal: {
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
    paddingHorizontal: 12,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  foodItemPressed: {
    backgroundColor: 'rgba(199, 127, 251, 0.1)',
  },
  foodItemBorder: {
    borderBottomWidth: 1,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
  },
  foodAmount: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  foodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calCol: {
    alignItems: 'flex-end',
  },
  foodCalories: {
    fontSize: 15,
    fontWeight: '600',
  },
  editIcon: {
    marginLeft: 10,
    opacity: 0.8,
  },
  foodCalUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 8,
    paddingLeft: 60,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(128, 128, 128, 0.08)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 24,
  },
  adviceContainer: {
    padding: 14,
    borderTopWidth: 1,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adviceTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adviceText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
