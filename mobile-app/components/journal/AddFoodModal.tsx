import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../types/theme';

interface FoodData {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AddFoodModalProps {
  visible: boolean;
  mealName: string;
  initialData?: FoodData & { id?: string };
  onClose: () => void;
  onSave: (food: FoodData) => void;
  onDelete?: (id: string) => void;
}

export default function AddFoodModal({ visible, mealName, initialData, onClose, onSave, onDelete }: AddFoodModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const theme = useThemeColors();

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name);
        setAmount(initialData.amount);
        setCalories(initialData.calories ? Math.round(initialData.calories).toString() : '0');
        setProtein(initialData.protein !== undefined ? Number(Number(initialData.protein).toFixed(1)).toString() : '');
        setCarbs(initialData.carbs !== undefined ? Number(Number(initialData.carbs).toFixed(1)).toString() : '');
        setFat(initialData.fat !== undefined ? Number(Number(initialData.fat).toFixed(1)).toString() : '');
      } else {
        setName('');
        setAmount('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
      }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim() || !calories.trim()) return;

    onSave({
      name: name.trim(),
      amount: amount.trim() || '1 serving',
      calories: parseInt(calories, 10) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!initialData?.id) return;
    
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this food log?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete?.(initialData.id!);
            onClose();
          }
        },
      ]
    );
  };

  const isEditing = !!initialData;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{isEditing ? 'Edit' : 'Add to'} {mealName}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Food Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
              placeholder="e.g. Apple"
              placeholderTextColor={theme.textDim}
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Amount</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                  placeholder="e.g. 100g"
                  placeholderTextColor={theme.textDim}
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Calories (kcal)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={theme.textDim}
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Protein (g)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={theme.textDim}
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Carbs (g)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={theme.textDim}
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Fat (g)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={theme.textDim}
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={setFat}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              {isEditing && (
                <TouchableOpacity 
                  style={[styles.deleteButton]} 
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  isEditing && { flex: 1, marginTop: 0 },
                  (!name.trim() || !calories.trim()) && styles.saveButtonDisabled
                ]} 
                onPress={handleSave}
                disabled={!name.trim() || !calories.trim()}
              >
                <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Add Food'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    height: 52,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
