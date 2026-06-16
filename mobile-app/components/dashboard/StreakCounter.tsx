import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '../../types/theme';

interface StreakCounterProps {
  days: number;
  isFrozen?: boolean;
}

function getMotivation(days: number, isFrozen: boolean): string {
  if (isFrozen) return "Streak Frozen! Log today to keep it hot.";
  if (days === 0) return 'Start logging today!';
  if (days === 1) return 'Great start!';
  if (days < 7) return 'Keep it going!';
  if (days < 14) return 'One week strong!';
  if (days < 30) return "You're on fire!";
  return 'Unstoppable!';
}

export default function StreakCounter({ days, isFrozen = false }: StreakCounterProps) {
  const motivation = getMotivation(days, isFrozen);
  const theme = useThemeColors();

  const showInfo = () => {
    Alert.alert(
      'How Streaks Work',
      '🔥 Active Streak: Log your food every day to increase your streak.\n\n❄️ Frozen (Grace Day): If you miss a day, your streak is "frozen" instead of breaking. You have one day to log and save your progress!',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const flameColor = isFrozen ? '#6b7280' : '#f97316';
  const glowColor = isFrozen ? 'rgba(107, 114, 128, 0.1)' : 'rgba(249, 115, 22, 0.15)';
  const wrapperBg = isFrozen ? 'rgba(107, 114, 128, 0.1)' : 'rgba(249, 115, 22, 0.12)';

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }, isFrozen ? styles.containerFrozen : { borderColor: 'rgba(249, 115, 22, 0.2)' }]}>
      <View style={[styles.flameGlow, { backgroundColor: glowColor }]} />
      <View style={styles.content}>
        <View style={[styles.flameWrapper, { backgroundColor: wrapperBg }]}>
          <Ionicons name="flame" size={32} color={flameColor} />
        </View>
        <View style={styles.textBlock}>
          <View style={styles.daysRow}>
            <View style={styles.daysMainRow}>
              <Text style={[styles.daysNumber, { color: flameColor }]}>{days}</Text>
              <Text style={[styles.daysLabel, { color: theme.textSecondary }]}> day{days !== 1 ? 's' : ''} streak</Text>
              <Pressable onPress={showInfo} style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
              </Pressable>
            </View>
            {isFrozen && (
              <View style={styles.frozenBadge}>
                <Ionicons name="snow" size={10} color="#38bdf8" />
                <Text style={styles.frozenText}>FROZEN</Text>
              </View>
            )}
          </View>
          <Text style={[styles.motivation, { color: theme.textMuted }]}>{motivation}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  containerFrozen: {
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  flameGlow: {
    position: 'absolute',
    top: -20,
    left: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flameWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1 },
  daysRow: {
    gap: 4,
    alignItems: 'flex-start',
  },
  daysMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  daysNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  daysLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoButton: {
    marginLeft: 4,
    padding: 2,
  },
  motivation: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  frozenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 0,
  },
  frozenText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
