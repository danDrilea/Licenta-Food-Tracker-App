import { Tabs, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Image, ScrollView, DeviceEventEmitter, Alert } from 'react-native';
import { useThemeColors } from '../../types/theme';
import ScanPhotoFlowModal from '../../components/journal/ScanPhotoFlowModal';
import BarcodeScannerModal from '../../components/journal/BarcodeScannerModal';
import AddFoodModal from '../../components/journal/AddFoodModal';
import { BarcodeProduct } from '../../db/barcodeService';
import { useSettings } from '../../contexts/SettingsContext';
import { useSQLiteContext } from 'expo-sqlite';
import { getLocalDateStr } from '../../types/utils';
import * as Haptics from 'expo-haptics';

const MENU_OPTIONS = [
  { icon: 'camera' as const, label: 'Scan Photo' },
  { icon: 'barcode' as const, label: 'Scan Barcode' },
  { icon: 'search' as const, label: 'Search Food' },
  { icon: 'scale-outline' as const, label: 'Log Weight' },
];

const triangleImg = require('../../assets/images/cool-triangle.webp');

export default function TabLayout() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const colors = useThemeColors();

  // Barcode Scanning Flow States
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<BarcodeProduct | null>(null);
  const [mealSelectorVisible, setMealSelectorVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<{ id: string, name: string } | null>(null);

  const handleSaveScannedFood = async (food: any) => {
    if (!selectedMeal) return;
    const localDateStr = getLocalDateStr();
    const id = Math.random().toString(36).substring(2, 15);

    try {
      await db.runAsync(
        'INSERT INTO food_entries (id, meal_id, date, name, amount, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, selectedMeal.id, localDateStr, food.name, food.amount, food.calories, food.protein, food.carbs, food.fat]
      );
      
      console.log(`[TabLayout] Saved scanned food: ${food.name} to meal: ${selectedMeal.name}`);
      
      // Notify active log subscribers
      DeviceEventEmitter.emit('food_logs_changed');
      
      // Delay second notification to let layout settle
      setTimeout(() => {
        DeviceEventEmitter.emit('food_logs_changed');
      }, 250);

      router.push('/journal');
    } catch (error) {
      console.error('[TabLayout] Error saving scanned food:', error);
      Alert.alert('Database Error', 'Could not save the food item to your journal.');
    } finally {
      setScannedProduct(null);
      setSelectedMeal(null);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#c77ffb',
          tabBarInactiveTintColor: colors.textDim,
          headerStyle: {
            backgroundColor: colors.headerBg,
          },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 0.8,
            height: 85,
            paddingBottom: 25,
            paddingTop: 5,
            shadowColor: colors.tabBarShadow,
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: 'Journal',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarButton: (props) => (
              <Pressable
                style={({ pressed }) => [
                  styles.addTabButton,
                  { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
                ]}
                onPress={() => setMenuOpen(true)}
              >
                <View style={styles.addButtonWrapper}>
                  <Image source={triangleImg} style={styles.triangleImage} />
                  <Ionicons name="add" color="#fff" size={28} style={styles.addIcon} />
                </View>
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} color={color} size={24} />
            ),
          }}
        />
      </Tabs>

      {/* Popup menu overlay */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.menuContainer, { backgroundColor: colors.cardBg }]} onPress={(e) => e.stopPropagation()}>
            {MENU_OPTIONS.map((option) => (
              <Pressable
                key={option.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: colors.rowPressed },
                ]}
                onPress={() => {
                  setMenuOpen(false);
                  if (option.label === 'Log Weight') {
                    router.push('/log-weight');
                  } else if (option.label === 'Scan Photo') {
                    setScanModalVisible(true);
                  } else if (option.label === 'Scan Barcode') {
                    setBarcodeScannerVisible(true);
                  } else {
                    console.log(option.label);
                  }
                }}
              >
                <View style={styles.menuIconCircle}>
                  <Ionicons name={option.icon} color="#fff" size={22} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{option.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Scan Photo Flow Modal */}
      <ScanPhotoFlowModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        onScanSuccess={(product) => {
          setScannedProduct(product);
          setMealSelectorVisible(true);
        }}
      />

      {/* Sleek Meal Selection Modal */}
      <Modal
        visible={mealSelectorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMealSelectorVisible(false)}
      >
        <View style={[styles.mealSelectOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.mealSelectContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.mealSelectHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.mealSelectTitle, { color: colors.textPrimary }]}>Choose Meal Slot</Text>
              <Text style={[styles.mealSelectSub, { color: colors.textSecondary }]}>
                Which meal should we add "{scannedProduct?.name}" to?
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.mealSelectScroll}>
              {settings.meals.filter(m => m.enabled).map((meal) => (
                <Pressable
                  key={meal.id}
                  style={({ pressed }) => [
                    styles.mealCard,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    pressed && styles.cardPressed
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedMeal({ id: meal.id, name: meal.name });
                    setMealSelectorVisible(false);
                  }}
                >
                  <View style={[styles.mealIconWrapper, { backgroundColor: 'rgba(199, 127, 251, 0.15)' }]}>
                    <Ionicons name={meal.icon as any} size={20} color="#c77ffb" />
                  </View>
                  <Text style={[styles.mealCardLabel, { color: colors.textPrimary }]}>{meal.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.cancelMealBtn,
                { borderColor: colors.border },
                pressed && { backgroundColor: colors.rowPressed }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMealSelectorVisible(false);
                setScannedProduct(null);
              }}
            >
              <Text style={[styles.cancelMealBtnText, { color: colors.textPrimary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* AddFoodModal to edit and confirm scanned food details */}
      {scannedProduct && selectedMeal && (
        <AddFoodModal
          visible={scannedProduct !== null && selectedMeal !== null}
          mealName={selectedMeal.name}
          initialData={scannedProduct}
          onClose={() => {
            setScannedProduct(null);
            setSelectedMeal(null);
          }}
          onSave={handleSaveScannedFood}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  addTabButton: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  addButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#8800ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addIcon: {
    position: 'absolute',
    top: 4,
  },
  triangleImage: {
    width: 100,
    height: 58,
    resizeMode: 'stretch',
    transform: [{ rotate: '180deg' }],
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 110,
  },

  menuContainer: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    width: 200,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8800ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  mealSelectOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  mealSelectContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
  },
  mealSelectHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  mealSelectTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  mealSelectSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  mealSelectScroll: {
    gap: 10,
    paddingBottom: 12,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  mealIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealCardLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelMealBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelMealBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
