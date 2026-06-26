import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { AppSettings, DEFAULT_SETTINGS, MealSlot, DailyGoals, MAX_MEALS, getNextMealId } from '../types/settings';
import type { ThemeMode, WeightUnit, HeightUnit, EnergyUnit } from '../types/settings';

interface MealSlotRow {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  enabled: number;
}

interface DailyGoalsRow {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water_glasses: number;
}

interface SettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setWeightUnit: (unit: WeightUnit) => void;
  setHeightUnit: (unit: HeightUnit) => void;
  setEnergyUnit: (unit: EnergyUnit) => void;
  updateMeals: (meals: MealSlot[]) => void;
  addMeal: (name: string) => void;
  removeMeal: (id: string) => void;
  renameMeal: (id: string, newName: string) => void;
  updateDailyGoals: (goals: DailyGoals) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setMealReminders: (enabled: boolean) => void;
  setRpiServerUrl: (url: string) => void;
  setBiometricLock: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      // 1. Fetch Basic Settings
      const basicRows = await db.getAllAsync<{ key: string, value: string }>('SELECT * FROM settings');
      const basicMap = Object.fromEntries(basicRows.map(r => [r.key, r.value]));

      // 2. Fetch Meal Slots
      const mealRows = await db.getAllAsync<MealSlotRow>('SELECT * FROM meal_slots ORDER BY sort_order ASC');
      const meals: MealSlot[] = mealRows.map(r => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        enabled: Boolean(r.enabled),
      }));

      // 3. Fetch Goals
      const goalRow = await db.getFirstAsync<DailyGoalsRow>('SELECT * FROM daily_goals WHERE id = 1');
      const dailyGoals: DailyGoals = {
        calories: goalRow?.calories ?? 2000,
        protein: goalRow?.protein ?? 150,
        carbs: goalRow?.carbs ?? 250,
        fat: goalRow?.fat ?? 70,
        waterGlasses: goalRow?.water_glasses ?? 8,
      };

      setSettings({
        theme: (basicMap.theme as ThemeMode) ?? 'dark',
        weightUnit: (basicMap.weightUnit as WeightUnit) ?? 'kg',
        heightUnit: (basicMap.heightUnit as HeightUnit) ?? 'cm',
        energyUnit: (basicMap.energyUnit as EnergyUnit) ?? 'kcal',
        meals,
        dailyGoals,
        notificationsEnabled: basicMap.notificationsEnabled === 'true',
        mealReminders: basicMap.mealReminders === 'true',
        rpiServerUrl: basicMap.rpiServerUrl ?? 'http://danalrpi.local:8000',
        biometricLock: basicMap.biometricLock === 'true',
      });
    } catch (e) {
      console.error('Failed to load settings from DB:', e);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateBasicSetting = useCallback(async (key: string, value: string) => {
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    await fetchSettings();
  }, [db, fetchSettings]);

  const setTheme = useCallback((theme: ThemeMode) => updateBasicSetting('theme', theme), [updateBasicSetting]);
  const toggleTheme = useCallback(() => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateBasicSetting('theme', newTheme);
  }, [settings.theme, updateBasicSetting]);

  const setWeightUnit = useCallback((unit: WeightUnit) => updateBasicSetting('weightUnit', unit), [updateBasicSetting]);
  const setHeightUnit = useCallback((unit: HeightUnit) => updateBasicSetting('heightUnit', unit), [updateBasicSetting]);
  const setEnergyUnit = useCallback((unit: EnergyUnit) => updateBasicSetting('energyUnit', unit), [updateBasicSetting]);
  const setNotificationsEnabled = useCallback((enabled: boolean) => updateBasicSetting('notificationsEnabled', String(enabled)), [updateBasicSetting]);
  const setMealReminders = useCallback((enabled: boolean) => updateBasicSetting('mealReminders', String(enabled)), [updateBasicSetting]);
  const setRpiServerUrl = useCallback((url: string) => updateBasicSetting('rpiServerUrl', url), [updateBasicSetting]);
  const setBiometricLock = useCallback((enabled: boolean) => updateBasicSetting('biometricLock', String(enabled)), [updateBasicSetting]);

  const updateDailyGoals = useCallback(async (goals: DailyGoals) => {
    await db.runAsync(
      'UPDATE daily_goals SET calories = ?, protein = ?, carbs = ?, fat = ?, water_glasses = ? WHERE id = 1',
      [goals.calories, goals.protein, goals.carbs, goals.fat, goals.waterGlasses]
    );
    await fetchSettings();
  }, [db, fetchSettings]);

  const addMeal = useCallback(async (name: string) => {
    if (settings.meals.length >= MAX_MEALS) return;
    const id = getNextMealId(settings.meals);
    await db.runAsync(
      'INSERT INTO meal_slots (id, name, icon, sort_order, enabled) VALUES (?, ?, ?, ?, ?)',
      [id, name, 'fast-food-outline', settings.meals.length, 1]
    );
    await fetchSettings();
  }, [db, settings.meals, fetchSettings]);

  const removeMeal = useCallback(async (id: string) => {
    await db.runAsync('DELETE FROM meal_slots WHERE id = ?', [id]);
    await fetchSettings();
  }, [db, fetchSettings]);

  const renameMeal = useCallback(async (id: string, newName: string) => {
    await db.runAsync('UPDATE meal_slots SET name = ? WHERE id = ?', [newName, id]);
    await fetchSettings();
  }, [db, fetchSettings]);

  const updateMeals = useCallback(async (meals: MealSlot[]) => {
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < meals.length; i++) {
        await db.runAsync('UPDATE meal_slots SET sort_order = ?, enabled = ? WHERE id = ?', [i, meals[i].enabled ? 1 : 0, meals[i].id]);
      }
    });
    await fetchSettings();
  }, [db, fetchSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        setTheme,
        toggleTheme,
        setWeightUnit,
        setHeightUnit,
        setEnergyUnit,
        updateMeals,
        addMeal,
        removeMeal,
        renameMeal,
        updateDailyGoals,
        setNotificationsEnabled,
        setMealReminders,
        setRpiServerUrl,
        setBiometricLock,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
}
