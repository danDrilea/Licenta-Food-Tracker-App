import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../../types/theme';
import BarcodeScannerModal from './BarcodeScannerModal';
import { BarcodeProduct } from '../../db/barcodeService';

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
  initialData?: (FoodData & { id?: string }) | null;
  onClose: () => void;
  onSave: (food: FoodData) => void;
  onDelete?: (id: string) => void;
  onLaunchPhotoScanner?: () => void;
  userCountry?: string;
}

export default function AddFoodModal({ visible, mealName, initialData, onClose, onSave, onDelete, onLaunchPhotoScanner, userCountry }: AddFoodModalProps) {
  const [name, setName] = useState('');
  const [grams, setGrams] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  
  // Choice HUB States
  const [viewState, setViewState] = useState<'HUB' | 'MANUAL'>('HUB');

  const theme = useThemeColors();

  const baseNutrientsRef = useRef<{ 
    caloriesPer100g: number; 
    proteinPer100g: number; 
    carbsPer100g: number; 
    fatPer100g: number; 
    baseGrams: number; 
    originalAmountString: string;
  } | null>(null);

  const recalcMacros = (gramsStr: string) => {
    const base = baseNutrientsRef.current;
    if (!base) return;
    
    const g = parseFloat(gramsStr) || 0;
    const ratio = (g / 100);
    
    if (ratio >= 0) {
      setCalories(Math.round(base.caloriesPer100g * ratio).toString());
      setProtein(Number((base.proteinPer100g * ratio).toFixed(1)).toString());
      setCarbs(Number((base.carbsPer100g * ratio).toFixed(1)).toString());
      setFat(Number((base.fatPer100g * ratio).toFixed(1)).toString());
    }
  };

  const cleanNumericInput = (text: string) => {
    let cleaned = text.replace(/,/g, '.');
    cleaned = cleaned.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const handleGramsChange = (val: string) => {
    const cleaned = cleanNumericInput(val);
    setGrams(cleaned);
    recalcMacros(cleaned);
  };

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name);
        setCalories(initialData.calories ? Math.round(initialData.calories).toString() : '0');
        setProtein(initialData.protein !== undefined ? Number(Number(initialData.protein).toFixed(1)).toString() : '');
        setCarbs(initialData.carbs !== undefined ? Number(Number(initialData.carbs).toFixed(1)).toString() : '');
        setFat(initialData.fat !== undefined ? Number(Number(initialData.fat).toFixed(1)).toString() : '');

        let g = 100;
        const amt = initialData.amount || '';
        const gMatch = amt.match(/(\d+(?:\.\d+)?)\s*g/i);
        if (gMatch) {
          g = parseFloat(gMatch[1]);
        } else {
          const numMatch = amt.match(/(\d+(?:\.\d+)?)/);
          if (numMatch) {
            g = parseFloat(numMatch[1]);
          }
        }
        
        setGrams(g.toString());

        const ratio = (g / 100);
        
        if (ratio > 0) {
          baseNutrientsRef.current = {
            caloriesPer100g: (initialData.calories || 0) / ratio,
            proteinPer100g: (initialData.protein || 0) / ratio,
            carbsPer100g: (initialData.carbs || 0) / ratio,
            fatPer100g: (initialData.fat || 0) / ratio,
            baseGrams: g,
            originalAmountString: amt
          };
        } else {
          baseNutrientsRef.current = null;
        }

        setViewState('MANUAL'); // Bypass hub when editing or pre-filled from scanned tab
      } else {
        setName('');
        setGrams('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
        baseNutrientsRef.current = null;
        setViewState('HUB'); // Show the choice hub when adding fresh food
      }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim() || !calories.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let finalAmount = grams ? `${grams}g` : '1 serving';
    if (!grams && baseNutrientsRef.current?.originalAmountString) {
      finalAmount = baseNutrientsRef.current.originalAmountString;
    }

    onSave({
      name: name.trim(),
      amount: finalAmount,
      calories: parseInt(calories, 10) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!initialData?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
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
  const isLocked = isEditing || !!baseNutrientsRef.current;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
          <View style={styles.header}>
            <View style={styles.headerLeftContainer}>
              {viewState !== 'HUB' && !isEditing && (
                <TouchableOpacity 
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewState('HUB'); }} 
                  hitSlop={10}
                  style={styles.backArrow}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              )}
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                {viewState === 'HUB' 
                  ? `Add to ${mealName}` 
                  : isEditing 
                    ? `Edit in ${mealName}` 
                    : baseNutrientsRef.current 
                      ? 'Adjust Portion'
                      : 'Manual Input'
                }
              </Text>
            </View>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} hitSlop={10}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* CHOICE HUB */}
          {viewState === 'HUB' && (
            <View style={styles.hubContainer}>
              <Text style={[styles.hubSubtitle, { color: theme.textSecondary }]}>
                Choose how you'd like to log your meal:
              </Text>

              <View style={styles.gridContainer}>
                {/* 1. Manual Input */}
                <TouchableOpacity
                  style={[styles.hubCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setViewState('MANUAL');
                  }}
                >
                  <View style={[styles.hubIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <Ionicons name="create-outline" size={22} color="#8b5cf6" />
                  </View>
                  <Text style={[styles.hubCardTitle, { color: theme.textPrimary }]}>Manual Input</Text>
                  <Text style={[styles.hubCardDesc, { color: theme.textDim }]}>Type names & nutrition numbers</Text>
                </TouchableOpacity>

                {/* 2. Barcode Scan */}
                <TouchableOpacity
                  style={[styles.hubCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setScannerVisible(true);
                  }}
                >
                  <View style={[styles.hubIconCircle, { backgroundColor: 'rgba(199, 127, 251, 0.15)' }]}>
                    <Ionicons name="barcode-outline" size={22} color="#c77ffb" />
                  </View>
                  <Text style={[styles.hubCardTitle, { color: theme.textPrimary }]}>Scan Barcode</Text>
                  <Text style={[styles.hubCardDesc, { color: theme.textDim }]}>Point camera at product barcode</Text>
                </TouchableOpacity>

                {/* 3. AI Photo Scan */}
                <TouchableOpacity
                  style={[styles.hubCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onClose();
                    onLaunchPhotoScanner?.();
                  }}
                >
                  <View style={[styles.hubIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Ionicons name="camera-outline" size={22} color="#3b82f6" />
                  </View>
                  <Text style={[styles.hubCardTitle, { color: theme.textPrimary }]}>AI Photo Scan</Text>
                  <Text style={[styles.hubCardDesc, { color: theme.textDim }]}>Estimate volume & mass by photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* MANUAL FORM INPUT */}
          {viewState === 'MANUAL' && (
            <ScrollView 
              style={styles.form}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <Text style={[styles.label, { color: theme.textMuted }]}>Food Name</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
                  isEditing && { opacity: 0.6, backgroundColor: 'transparent' }
                ]}
                placeholder="e.g. Apple"
                placeholderTextColor={theme.textDim}
                value={name}
                onChangeText={setName}
                editable={!isEditing}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={[styles.label, { color: theme.textMuted }]} numberOfLines={1}>
                    {baseNutrientsRef.current ? 'Grams per Serving' : 'Grams'} {baseNutrientsRef.current ? `• ${baseNutrientsRef.current.originalAmountString}` : ''}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                    placeholder="100"
                    placeholderTextColor={theme.textDim}
                    keyboardType="decimal-pad"
                    value={grams}
                    onChangeText={handleGramsChange}
                  />
                </View>
                <View style={{ width: 16 }} />
                <View style={styles.flex1}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Calories (kcal)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }, isLocked && { opacity: 0.6, backgroundColor: 'transparent' }]}
                    placeholder="0"
                    placeholderTextColor={theme.textDim}
                    keyboardType="decimal-pad"
                    value={calories}
                    editable={!isLocked}
                    onChangeText={(val) => setCalories(cleanNumericInput(val))}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Protein (g)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }, isLocked && { opacity: 0.6, backgroundColor: 'transparent' }]}
                    placeholder="0"
                    placeholderTextColor={theme.textDim}
                    keyboardType="decimal-pad"
                    value={protein}
                    editable={!isLocked}
                    onChangeText={(val) => setProtein(cleanNumericInput(val))}
                  />
                </View>
                <View style={{ width: 16 }} />
                <View style={styles.flex1}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Carbs (g)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }, isLocked && { opacity: 0.6, backgroundColor: 'transparent' }]}
                    placeholder="0"
                    placeholderTextColor={theme.textDim}
                    keyboardType="decimal-pad"
                    value={carbs}
                    editable={!isLocked}
                    onChangeText={(val) => setCarbs(cleanNumericInput(val))}
                  />
                </View>
                <View style={{ width: 16 }} />
                <View style={styles.flex1}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Fat (g)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }, isLocked && { opacity: 0.6, backgroundColor: 'transparent' }]}
                    placeholder="0"
                    placeholderTextColor={theme.textDim}
                    keyboardType="decimal-pad"
                    value={fat}
                    editable={!isLocked}
                    onChangeText={(val) => setFat(cleanNumericInput(val))}
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
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanSuccess={(product) => {
          setName(product.name);
          setCalories(product.calories.toString());
          setProtein(product.protein.toString());
          setCarbs(product.carbs.toString());
          setFat(product.fat.toString());

          const baseGrams = product.servingGrams || 100;
          setGrams(baseGrams.toString());

          // Set base nutrients for portion scaling
          baseNutrientsRef.current = {
            caloriesPer100g: product.caloriesPer100g || product.calories / (baseGrams / 100),
            proteinPer100g: product.proteinPer100g || product.protein / (baseGrams / 100),
            carbsPer100g: product.carbsPer100g || product.carbs / (baseGrams / 100),
            fatPer100g: product.fatPer100g || product.fat / (baseGrams / 100),
            baseGrams: baseGrams,
            originalAmountString: product.amount
          };
          setViewState('MANUAL');
        }}
      />
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
  barcodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 4,
    borderStyle: 'dashed',
  },
  barcodeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backArrow: {
    paddingRight: 4,
  },
  
  // Hub Grid
  hubContainer: {
    paddingVertical: 8,
  },
  hubSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  hubCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 120,
  },
  hubIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  hubCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  hubCardDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
});
