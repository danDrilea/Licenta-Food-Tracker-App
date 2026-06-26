import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import NestableDraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { MealSlot, MAX_MEALS } from '../../types/settings';
import { useThemeColors } from '../../types/theme';

interface MealEditorProps {
  meals: MealSlot[];
  onUpdateMeals: (meals: MealSlot[]) => void;
  onAddMeal: (name: string) => void;
  onRemoveMeal: (id: string) => void;
  onRenameMeal: (id: string, newName: string) => void;
}

export default function MealEditor({
  meals,
  onUpdateMeals,
  onAddMeal,
  onRemoveMeal,
  onRenameMeal,
}: MealEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const theme = useThemeColors();

  const canAdd = meals.length < MAX_MEALS;

  const startEdit = (meal: MealSlot) => {
    setEditingId(meal.id);
    setEditName(meal.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onRenameMeal(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleAdd = () => {
    if (newName.trim()) {
      onAddMeal(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  const confirmRemove = (meal: MealSlot) => {
    Alert.alert(
      'Remove Meal',
      `Are you sure you want to remove "${meal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemoveMeal(meal.id) },
      ],
    );
  };

  const renderItem = ({ item: meal, drag, isActive, getIndex }: RenderItemParams<MealSlot>) => {
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator activeScale={1}>
        <View
          style={[
            styles.mealRow,
            index < meals.length - 1 && [styles.mealRowBorder, { borderBottomColor: theme.border }],
            isActive && { backgroundColor: theme.rowPressed },
          ]}
        >
          <Pressable onPressIn={drag} style={styles.dragHandle} hitSlop={8}>
            <Ionicons name="menu-outline" size={20} color={theme.textDim} />
          </Pressable>

          <View style={styles.mealIcon}>
            <Ionicons name={meal.icon as any} size={18} color="#c77ffb" />
          </View>

          {editingId === meal.id ? (
            <View style={styles.editRow}>
              <TextInput
                style={[styles.editInput, { color: theme.textPrimary }]}
                value={editName}
                onChangeText={setEditName}
                autoFocus
                maxLength={20}
                placeholderTextColor={theme.textDimmer}
                onSubmitEditing={saveEdit}
                onBlur={saveEdit}
              />
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); saveEdit(); }} hitSlop={8}>
                <Ionicons name="checkmark-circle" size={22} color="#4ade80" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.displayRow}>
              <Text style={[styles.mealName, { color: theme.textSecondary }]}>{meal.name}</Text>
              <View style={styles.actions}>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); startEdit(meal); }} hitSlop={8} style={styles.actionBtn}>
                  <Ionicons name="pencil-outline" size={16} color={theme.textDim} />
                </Pressable>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); confirmRemove(meal); }} hitSlop={8} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Meals</Text>
        <Text style={[styles.counter, { color: theme.textDim }]}>{meals.length} / {MAX_MEALS}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <NestableDraggableFlatList
          data={meals}
          onDragEnd={({ data }) => onUpdateMeals(data)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />

        {isAdding ? (
          <View style={styles.addRow}>
            <Ionicons name="fast-food-outline" size={18} color={theme.textDim} style={styles.addIcon} />
            <TextInput
              style={[styles.editInput, { color: theme.textPrimary }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Meal name..."
              placeholderTextColor={theme.textDimmer}
              autoFocus
              maxLength={20}
              onSubmitEditing={handleAdd}
            />
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleAdd(); }} hitSlop={8}>
              <Ionicons name="checkmark-circle" size={22} color="#4ade80" />
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsAdding(false); setNewName(''); }} hitSlop={8}>
              <Ionicons name="close-circle" size={22} color={theme.textDim} />
            </Pressable>
          </View>
        ) : canAdd ? (
          <Pressable
            style={({ pressed }) => [styles.addButton, { borderTopColor: theme.border }, pressed && styles.addButtonPressed]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsAdding(true); }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#8b5cf6" />
            <Text style={styles.addButtonText}>Add meal</Text>
          </Pressable>
        ) : (
          <View style={[styles.maxReached, { borderTopColor: theme.border }]}>
            <Text style={[styles.maxText, { color: theme.textDimmer }]}>Maximum {MAX_MEALS} meals reached</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  counter: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  mealRowBorder: {
    borderBottomWidth: 1,
  },
  dragHandle: {
    padding: 4,
    marginLeft: -4,
  },
  mealIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealName: {
    fontSize: 15,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  editRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#8b5cf6',
    paddingVertical: 4,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  addIcon: {
    marginRight: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  addButtonPressed: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  addButtonText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '600',
  },
  maxReached: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  maxText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
