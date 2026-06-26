import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, ActivityIndicator, Alert, ScrollView, DeviceEventEmitter } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useSettings } from '../../contexts/SettingsContext';
import { useThemeColors } from '../../types/theme';
import { getLocalDateStr, formatFoodName, cleanServerUrl } from '../../types/utils';
interface ScanPhotoFlowModalProps {
  visible: boolean;
  onClose: () => void;
}

type FlowStep = 'PICK_SOURCE' | 'HEIGHT_SELECT' | 'PROCESSING' | 'MEAL_SELECT';

interface DetectedItem {
  name: string;
  grams: number;
}

export default function ScanPhotoFlowModal({ visible, onClose }: ScanPhotoFlowModalProps) {
  const router = useRouter();
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const theme = useThemeColors();

  const [step, setStep] = useState<FlowStep>('PICK_SOURCE');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);

  // Reset state on modal open/close
  useEffect(() => {
    if (visible) {
      setStep('PICK_SOURCE');
      setSelectedImage(null);
      setDetectedItems([]);
    }
  }, [visible]);

  // Phase 1: Source Selection handlers
  const handlePickImage = async (useCamera: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to take pictures.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Media library permission is required to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setStep('HEIGHT_SELECT');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'An error occurred while picking the image.');
    }
  };

  // Phase 2: Height Selection & Server Upload
  const handleSelectHeightClass = async (heightClass: 'A' | 'B' | 'C') => {
    if (!selectedImage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setStep('PROCESSING');

    try {
      const formData = new FormData();
      // On React Native, FormData requires an object with uri, name, and type for files.
      formData.append('photo', {
        uri: selectedImage,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      const baseUrl = settings.rpiServerUrl || 'http://danalrpi.local:8000';
      const cleanUrl = cleanServerUrl(baseUrl);

      const response = await fetch(`${cleanUrl}/analyze-food?depth_category=${heightClass}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status}`);
      }

      const result = await response.json();
      console.log('AI Scanner Server Response Result:', JSON.stringify(result, null, 2));

      if (result.status === 'success') {
        if (!result.detections || result.detections.length === 0) {
          Alert.alert(
            'No Food Detected',
            'The AI could not recognize any food items in the image. Please try again with a clearer photo.',
            [{ text: 'OK', onPress: () => setStep('PICK_SOURCE') }]
          );
          return;
        }

        // Aggregate duplicates: if YOLO detects multiple items of the same food class, combine their weights
        const aggregationMap: Record<string, number> = {};
        result.detections.forEach((det: any) => {
          const name = det.food_item;
          const mass = det.mass_grams || 0;
          if (mass > 0) {
            aggregationMap[name] = (aggregationMap[name] || 0) + mass;
          }
        });

        const compiledItems: DetectedItem[] = Object.keys(aggregationMap).map(name => ({
          name,
          grams: aggregationMap[name]
        }));

        console.log('AI Scanner Compiled Items:', JSON.stringify(compiledItems, null, 2));

        if (compiledItems.length === 0) {
          Alert.alert('Zero Weight', 'Detected items are too small to weigh. Please try again.');
          setStep('PICK_SOURCE');
          return;
        }

        setDetectedItems(compiledItems);
        setStep('MEAL_SELECT');
      } else {
        throw new Error(result.message || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('API /analyze-food error:', error);
      Alert.alert(
        'Server Connection Failed',
        error.message || 'Cannot reach the Raspberry Pi server. Verify connection settings and try again.',
        [{ text: 'OK', onPress: () => setStep('PICK_SOURCE') }]
      );
    }
  };

  // Phase 3: Logging to Database
  const handleSelectMeal = async (mealId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Logging items to meal:', mealId, 'Items:', JSON.stringify(detectedItems, null, 2));
    try {
      // Calculate local date string securely
      const localDateStr = getLocalDateStr();

      // 1. Fetch nutrients for all detected items first (outside the write transaction)
      const itemsToInsert: {
        id: string;
        mealId: string;
        dateStr: string;
        name: string;
        amount: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }[] = [];
      for (const item of detectedItems) {
        const normalizedKey = item.name.toLowerCase().trim();
        const nutrientsRow = await db.getFirstAsync<{ calories: number, protein: number, carbs: number, fat: number }>(
          'SELECT calories, protein, carbs, fat FROM food_classes_nutrition WHERE name = ?',
          [normalizedKey]
        );

        // Fallback values if key not found (should not happen for the 73 classes)
        const caloriesPer100g = nutrientsRow?.calories ?? 80;
        const proteinPer100g = nutrientsRow?.protein ?? 2;
        const carbsPer100g = nutrientsRow?.carbs ?? 10;
        const fatPer100g = nutrientsRow?.fat ?? 2;

        const scale = item.grams / 100;
        const calories = Math.round(caloriesPer100g * scale);
        const protein = Math.round((proteinPer100g * scale) * 10) / 10;
        const carbs = Math.round((carbsPer100g * scale) * 10) / 10;
        const fat = Math.round((fatPer100g * scale) * 10) / 10;

        const id = Math.random().toString(36).substring(2, 15);
        const capitalizedName = formatFoodName(item.name);
        const amountText = `${Math.round(item.grams)} g`;

        console.log(`[SQL Lookup] Item: ${capitalizedName} (${amountText}) -> Calories: ${calories}, P: ${protein}, C: ${carbs}, F: ${fat}`);

        itemsToInsert.push({
          id,
          mealId,
          dateStr: localDateStr,
          name: capitalizedName,
          amount: amountText,
          calories,
          protein,
          carbs,
          fat
        });
      }

      // 2. Save each detected item to sqlite database in a transaction
      await db.withTransactionAsync(async () => {
        for (const item of itemsToInsert) {
          await db.runAsync(
            'INSERT INTO food_entries (id, meal_id, date, name, amount, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item.id, item.mealId, item.dateStr, item.name, item.amount, item.calories, item.protein, item.carbs, item.fat]
          );
        }
      });

      console.log('Database logging transaction successful.');

      onClose();
      // Redirect to Journal screen
      router.push('/journal');

      // Notify active listeners immediately
      DeviceEventEmitter.emit('food_logs_changed');
      
      // Also notify after a short delay to ensure any navigation transitions or database WAL writes have fully settled
      setTimeout(() => {
        console.log('[ScanPhotoFlowModal] Emitting deferred "food_logs_changed" event');
        DeviceEventEmitter.emit('food_logs_changed');
      }, 250);
    } catch (error) {
      console.error('Database write error:', error);
      Alert.alert('Database Error', 'Could not save the food logs locally.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>AI Photo Scanner</Text>
            {step !== 'PROCESSING' && (
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.textDim} />
              </Pressable>
            )}
          </View>

          {/* Content Steps */}
          <View style={styles.content}>
            {step === 'PICK_SOURCE' && (
              <View style={styles.stepContainer}>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Scan food items and estimate nutrition values by capturing or uploading a photo.
                </Text>
                
                <View style={styles.sourceGrid}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.sourceCard,
                      { borderColor: theme.border, backgroundColor: theme.background },
                      pressed && styles.cardPressed
                    ]}
                    onPress={() => handlePickImage(true)}
                  >
                    <View style={[styles.iconWrapper, { backgroundColor: 'rgba(199, 127, 251, 0.15)' }]}>
                      <Ionicons name="camera-outline" size={28} color="#c77ffb" />
                    </View>
                    <Text style={[styles.sourceLabel, { color: theme.textPrimary }]}>Take Photo</Text>
                    <Text style={[styles.sourceDesc, { color: theme.textDim }]}>Use camera to capture plate</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.sourceCard,
                      { borderColor: theme.border, backgroundColor: theme.background },
                      pressed && styles.cardPressed
                    ]}
                    onPress={() => handlePickImage(false)}
                  >
                    <View style={[styles.iconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                      <Ionicons name="images-outline" size={28} color="#8b5cf6" />
                    </View>
                    <Text style={[styles.sourceLabel, { color: theme.textPrimary }]}>Photo Gallery</Text>
                    <Text style={[styles.sourceDesc, { color: theme.textDim }]}>Pick from device gallery</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {step === 'HEIGHT_SELECT' && (
              <View style={styles.stepContainer}>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Select the approximate height category of the food on the plate:
                </Text>

                <ScrollView style={styles.cardsScroll} contentContainerStyle={styles.cardsContainer}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.heightCard,
                      { borderColor: theme.border, backgroundColor: theme.background },
                      pressed && styles.cardPressed
                    ]}
                    onPress={() => handleSelectHeightClass('A')}
                  >
                    <View style={[styles.badge, { backgroundColor: 'rgba(199, 127, 251, 0.2)' }]}>
                      <Text style={styles.badgeText}>A</Text>
                    </View>
                    <View style={styles.heightTextContent}>
                      <Text style={[styles.heightTitle, { color: theme.textPrimary }]}>Flat</Text>
                      <Text style={[styles.heightDesc, { color: theme.textSecondary }]}>flat foods under 5 cm</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textDim} />
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.heightCard,
                      { borderColor: theme.border, backgroundColor: theme.background },
                      pressed && styles.cardPressed
                    ]}
                    onPress={() => handleSelectHeightClass('B')}
                  >
                    <View style={[styles.badge, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                      <Text style={styles.badgeText}>B</Text>
                    </View>
                    <View style={styles.heightTextContent}>
                      <Text style={[styles.heightTitle, { color: theme.textPrimary }]}>Medium</Text>
                      <Text style={[styles.heightDesc, { color: theme.textSecondary }]}>medium but still a bit tall 10 cm</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textDim} />
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.heightCard,
                      { borderColor: theme.border, backgroundColor: theme.background },
                      pressed && styles.cardPressed
                    ]}
                    onPress={() => handleSelectHeightClass('C')}
                  >
                    <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                      <Text style={[styles.badgeText, { color: '#ef4444' }]}>C</Text>
                    </View>
                    <View style={styles.heightTextContent}>
                      <Text style={[styles.heightTitle, { color: theme.textPrimary }]}>Tall</Text>
                      <Text style={[styles.heightDesc, { color: theme.textSecondary }]}>extremely tall 15 cm</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textDim} />
                  </Pressable>
                </ScrollView>

                <Pressable
                  style={({ pressed }) => [
                    styles.backBtn,
                    { borderColor: theme.border },
                    pressed && { backgroundColor: theme.rowPressed }
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep('PICK_SOURCE'); }}
                >
                  <Ionicons name="arrow-back" size={16} color={theme.textPrimary} />
                  <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>Back</Text>
                </Pressable>
              </View>
            )}

            {step === 'PROCESSING' && (
              <View style={[styles.stepContainer, styles.center]}>
                <ActivityIndicator size="large" color="#c77ffb" />
                <Text style={[styles.processingText, { color: theme.textPrimary }]}>Analyzing food photo...</Text>
                <Text style={[styles.processingSubText, { color: theme.textMuted }]}>
                  Estimating volume & mass on Raspberry Pi server
                </Text>
              </View>
            )}

            {step === 'MEAL_SELECT' && (
              <View style={styles.stepContainer}>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Detected food item(s):
                </Text>
                
                <View style={[styles.detectedItemsBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  {detectedItems.map((item, idx) => (
                    <View key={item.name} style={[styles.detectedRow, idx < detectedItems.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.border }]}>
                      <Text style={[styles.detectedName, { color: theme.textPrimary }]}>{formatFoodName(item.name)}</Text>
                      <Text style={[styles.detectedGrams, { color: '#c77ffb' }]}>{Math.round(item.grams)} g</Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.subtitle, { color: theme.textSecondary, marginTop: 12 }]}>
                  Which meal slot should we log these to?
                </Text>

                <ScrollView style={styles.cardsScroll} contentContainerStyle={styles.cardsContainer}>
                  {settings.meals.filter(m => m.enabled).map((meal) => (
                    <Pressable
                      key={meal.id}
                      style={({ pressed }) => [
                        styles.heightCard,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        pressed && styles.cardPressed
                      ]}
                      onPress={() => handleSelectMeal(meal.id)}
                    >
                      <View style={[styles.badge, { backgroundColor: 'rgba(199, 127, 251, 0.15)' }]}>
                        <Ionicons name={meal.icon as any} size={16} color="#c77ffb" />
                      </View>
                      <View style={styles.heightTextContent}>
                        <Text style={[styles.heightTitle, { color: theme.textPrimary }]}>{meal.name}</Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={20} color="#c77ffb" />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  stepContainer: {
    width: '100%',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 16,
  },
  sourceGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  sourceCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  sourceDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  cardsScroll: {
    maxHeight: 280,
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 10,
  },
  heightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#c77ffb',
  },
  heightTextContent: {
    flex: 1,
  },
  heightTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  heightDesc: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  processingSubText: {
    fontSize: 13,
    textAlign: 'center',
  },
  detectedItemsBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detectedName: {
    fontSize: 14,
    fontWeight: '600',
  },
  detectedGrams: {
    fontSize: 14,
    fontWeight: '700',
  },
});
