import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MealSlot, MAX_MEALS } from '../../types/settings';

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Meals</Text>
        <Text style={styles.counter}>{meals.length} / {MAX_MEALS}</Text>
      </View>

      <View style={styles.card}>
        {meals.map((meal, index) => (
          <View
            key={meal.id}
            style={[styles.mealRow, index < meals.length - 1 && styles.mealRowBorder]}
          >
            {/* Icon */}
            <View style={styles.mealIcon}>
              <Ionicons name={meal.icon as any} size={18} color="#c77ffb" />
            </View>

            {/* Name (editable or display) */}
            {editingId === meal.id ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                  maxLength={20}
                  placeholderTextColor="#4b5563"
                  onSubmitEditing={saveEdit}
                  onBlur={saveEdit}
                />
                <Pressable onPress={saveEdit} hitSlop={8}>
                  <Ionicons name="checkmark-circle" size={22} color="#4ade80" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.displayRow}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <View style={styles.actions}>
                  <Pressable onPress={() => startEdit(meal)} hitSlop={8} style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={16} color="#6b7280" />
                  </Pressable>
                  <Pressable onPress={() => confirmRemove(meal)} hitSlop={8} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Add new meal */}
        {isAdding ? (
          <View style={styles.addRow}>
            <Ionicons name="fast-food-outline" size={18} color="#6b7280" style={styles.addIcon} />
            <TextInput
              style={styles.editInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Meal name..."
              placeholderTextColor="#4b5563"
              autoFocus
              maxLength={20}
              onSubmitEditing={handleAdd}
            />
            <Pressable onPress={handleAdd} hitSlop={8}>
              <Ionicons name="checkmark-circle" size={22} color="#4ade80" />
            </Pressable>
            <Pressable onPress={() => { setIsAdding(false); setNewName(''); }} hitSlop={8}>
              <Ionicons name="close-circle" size={22} color="#6b7280" />
            </Pressable>
          </View>
        ) : canAdd ? (
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            onPress={() => setIsAdding(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#8b5cf6" />
            <Text style={styles.addButtonText}>Add meal</Text>
          </Pressable>
        ) : (
          <View style={styles.maxReached}>
            <Text style={styles.maxText}>Maximum {MAX_MEALS} meals reached</Text>
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
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  counter: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
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
    borderBottomColor: '#2a2d35',
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
    color: '#e5e7eb',
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
    color: '#ffffff',
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
  maxReached: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2a2d35',
  },
  maxText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '500',
  },
});
