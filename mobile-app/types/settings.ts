// ─── Settings Types ─────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light';

export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'ft';
export type EnergyUnit = 'kcal' | 'kj';

export interface MealSlot {
  id: string;
  name: string;
  icon: string; // Ionicons name
  enabled: boolean;
}

export interface DailyGoals {
  calories: number;
  protein: number;   // grams
  carbs: number;     // grams
  fat: number;       // grams
  waterGlasses: number;
}

export interface AppSettings {
  theme: ThemeMode;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  energyUnit: EnergyUnit;
  meals: MealSlot[];
  dailyGoals: DailyGoals;
  notificationsEnabled: boolean;
  mealReminders: boolean;
}

export const MAX_MEALS = 8;

export const DEFAULT_MEALS: MealSlot[] = [
  { id: 'breakfast', name: 'Breakfast', icon: 'sunny-outline', enabled: true },
  { id: 'lunch', name: 'Lunch', icon: 'restaurant-outline', enabled: true },
  { id: 'dinner', name: 'Dinner', icon: 'moon-outline', enabled: true },
  { id: 'snacks', name: 'Snacks', icon: 'cafe-outline', enabled: true },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  weightUnit: 'kg',
  heightUnit: 'cm',
  energyUnit: 'kcal',
  meals: DEFAULT_MEALS,
  dailyGoals: {
    calories: 2100,
    protein: 140,
    carbs: 250,
    fat: 70,
    waterGlasses: 8,
  },
  notificationsEnabled: false,
  mealReminders: false,
};

// Icon options for custom meals
export const MEAL_ICON_OPTIONS: string[] = [
  'sunny-outline',
  'restaurant-outline',
  'moon-outline',
  'cafe-outline',
  'nutrition-outline',
  'pizza-outline',
  'ice-cream-outline',
  'beer-outline',
  'fast-food-outline',
  'fish-outline',
  'leaf-outline',
  'wine-outline',
];

export const UNIT_LABELS = {
  kg: 'Kilograms (kg)',
  lbs: 'Pounds (lbs)',
  cm: 'Centimeters (cm)',
  ft: 'Feet & Inches (ft)',
  kcal: 'Calories (kcal)',
  kj: 'Kilojoules (kJ)',
};
