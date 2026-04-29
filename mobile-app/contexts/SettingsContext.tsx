import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS, MealSlot, DailyGoals, MAX_MEALS, getNextMealId } from '../types/settings';
import type { ThemeMode, WeightUnit, HeightUnit, EnergyUnit } from '../types/settings';

const STORAGE_KEY = 'app_settings';

interface SettingsContextType {
  settings: AppSettings;
  isLoading: boolean;

  // Theme
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // Units
  setWeightUnit: (unit: WeightUnit) => void;
  setHeightUnit: (unit: HeightUnit) => void;
  setEnergyUnit: (unit: EnergyUnit) => void;

  // Meals
  updateMeals: (meals: MealSlot[]) => void;
  addMeal: (name: string) => void;
  removeMeal: (id: string) => void;
  renameMeal: (id: string, newName: string) => void;

  // Goals
  updateDailyGoals: (goals: DailyGoals) => void;

  // Notifications
  setNotificationsEnabled: (enabled: boolean) => void;
  setMealReminders: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<AppSettings>;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (e) {
        console.warn('Failed to load settings:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Persist settings whenever they change
  const persist = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, []);

  // ─── Theme ─────────────────────────────────────
  const setTheme = useCallback((theme: ThemeMode) => {
    persist({ ...settings, theme });
  }, [settings, persist]);

  const toggleTheme = useCallback(() => {
    persist({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' });
  }, [settings, persist]);

  // ─── Units ─────────────────────────────────────
  const setWeightUnit = useCallback((weightUnit: WeightUnit) => {
    persist({ ...settings, weightUnit });
  }, [settings, persist]);

  const setHeightUnit = useCallback((heightUnit: HeightUnit) => {
    persist({ ...settings, heightUnit });
  }, [settings, persist]);

  const setEnergyUnit = useCallback((energyUnit: EnergyUnit) => {
    persist({ ...settings, energyUnit });
  }, [settings, persist]);

  // ─── Meals ─────────────────────────────────────
  const updateMeals = useCallback((meals: MealSlot[]) => {
    persist({ ...settings, meals: meals.slice(0, MAX_MEALS) });
  }, [settings, persist]);

  const addMeal = useCallback((name: string) => {
    if (settings.meals.length >= MAX_MEALS) return;
    const id = getNextMealId(settings.meals);
    const newMeal: MealSlot = {
      id,
      name,
      icon: 'fast-food-outline',
      enabled: true,
    };
    persist({ ...settings, meals: [...settings.meals, newMeal] });
  }, [settings, persist]);

  const removeMeal = useCallback((id: string) => {
    persist({ ...settings, meals: settings.meals.filter((m) => m.id !== id) });
  }, [settings, persist]);

  const renameMeal = useCallback((id: string, newName: string) => {
    persist({
      ...settings,
      meals: settings.meals.map((m) => (m.id === id ? { ...m, name: newName } : m)),
    });
  }, [settings, persist]);

  // ─── Goals ─────────────────────────────────────
  const updateDailyGoals = useCallback((dailyGoals: DailyGoals) => {
    persist({ ...settings, dailyGoals });
  }, [settings, persist]);

  // ─── Notifications ────────────────────────────
  const setNotificationsEnabled = useCallback((notificationsEnabled: boolean) => {
    persist({ ...settings, notificationsEnabled });
  }, [settings, persist]);

  const setMealReminders = useCallback((mealReminders: boolean) => {
    persist({ ...settings, mealReminders });
  }, [settings, persist]);

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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
