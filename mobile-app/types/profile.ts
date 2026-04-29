// ─── User & Profile Types ───────────────────────────────────────────

export type GoalType = 'weight_loss' | 'weight_gain' | 'maintain' | 'custom';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export type Sex = 'male' | 'female';

export interface UserGoal {
  type: GoalType;
  targetWeight?: number;        // kg
  weeklyRate?: number;          // kg/week (0.25, 0.5, 0.75, 1.0)
  customCalorieTarget?: number; // only for 'custom'
}

export interface WeightEntry {
  date: string;   // ISO date string
  weight: number; // kg
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  country: string;
  sex: Sex;
  heightCm: number;
  currentWeightKg: number;
  activityLevel: ActivityLevel;
  goal: UserGoal;
  weightHistory: WeightEntry[];
  avatarUri?: string;
}

// ─── Display helpers ────────────────────────────────────────────────

export const GOAL_LABELS: Record<GoalType, string> = {
  weight_loss: 'Lose Weight',
  weight_gain: 'Gain Weight',
  maintain: 'Maintain Weight',
  custom: 'Custom Goal',
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active',
  extra_active: 'Extra Active',
};

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

// ─── Calculation helpers ────────────────────────────────────────────

export function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Mifflin-St Jeor BMR formula */
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export interface BMICategory {
  label: string;
  color: string;
}

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return { label: 'Underweight', color: '#38bdf8' };
  if (bmi < 25) return { label: 'Normal', color: '#4ade80' };
  if (bmi < 30) return { label: 'Overweight', color: '#facc15' };
  return { label: 'Obese', color: '#ef4444' };
}
