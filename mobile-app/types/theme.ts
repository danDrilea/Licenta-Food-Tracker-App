import { useSettings } from '../contexts/SettingsContext';

// ─── Color Palette Type ─────────────────────────────────────────────

export interface ThemeColors {
  // Backgrounds
  background: string;
  cardBg: string;
  headerBg: string;
  tabBarBg: string;
  inputBg: string;
  overlay: string;

  // Borders & Dividers
  border: string;
  inputBorder: string;

  // Text hierarchy
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  textDimmer: string;

  // Interactive
  switchTrackOff: string;
  rowPressed: string;

  // Domain-specific
  waterDim: string;

  // Tab bar
  tabBarBorder: string;
  tabBarShadow: string;
}

// ─── Dark Palette ───────────────────────────────────────────────────

export const darkColors: ThemeColors = {
  background: '#25292e',
  cardBg: '#1e2126',
  headerBg: '#25292e',
  tabBarBg: '#131517',
  inputBg: '#25292e',
  overlay: 'rgba(0, 0, 0, 0.7)',

  border: '#2a2d35',
  inputBorder: '#374151',

  textPrimary: '#ffffff',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  textDim: '#6b7280',
  textDimmer: '#4b5563',

  switchTrackOff: '#2a2d35',
  rowPressed: '#2a2d35',

  waterDim: '#1e3a4d',

  tabBarBorder: '#6d28d9',
  tabBarShadow: '#8800ff',
};

// ─── Light Palette ──────────────────────────────────────────────────

export const lightColors: ThemeColors = {
  background: '#f5f3f0',
  cardBg: '#ffffff',
  headerBg: '#f5f3f0',
  tabBarBg: '#ffffff',
  inputBg: '#f0ede8',
  overlay: 'rgba(0, 0, 0, 0.4)',

  border: '#e8e5e0',
  inputBorder: '#d8d4cc',

  textPrimary: '#1a1625',
  textSecondary: '#2d2640',
  textMuted: '#6b6380',
  textDim: '#8a8498',
  textDimmer: '#b0a8c0',

  switchTrackOff: '#e0ddd8',
  rowPressed: '#ece9e4',

  waterDim: '#c8dfe8',

  tabBarBorder: '#c4b5fc',
  tabBarShadow: '#c4b5fc',
};

// ─── Hook ───────────────────────────────────────────────────────────

export function useThemeColors(): ThemeColors {
  const { settings } = useSettings();
  return settings.theme === 'dark' ? darkColors : lightColors;
}
