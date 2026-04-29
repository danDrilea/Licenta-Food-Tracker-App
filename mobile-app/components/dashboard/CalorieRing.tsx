import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CalorieRingProps {
  consumed: number;
  goal: number;
}

const RING_SIZE = 200;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getRingColor(percentage: number): { start: string; end: string } {
  if (percentage <= 0.6) {
    return { start: '#4ade80', end: '#22c55e' }; // green
  } else if (percentage <= 0.85) {
    return { start: '#facc15', end: '#eab308' }; // yellow
  } else {
    return { start: '#ef4444', end: '#dc2626' }; // red
  }
}

export default function CalorieRing({ consumed, goal }: CalorieRingProps) {
  const remaining = Math.max(0, goal - consumed);
  const percentage = Math.min(consumed / goal, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - percentage);
  const colors = getRingColor(percentage);

  return (
    <View style={styles.container}>
      <View style={styles.ringWrapper}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.start} />
              <Stop offset="100%" stopColor={colors.end} />
            </LinearGradient>
          </Defs>

          {/* Background track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="#2a2d35"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />

          {/* Progress arc */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="url(#ringGradient)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        {/* Center text */}
        <View style={styles.centerText}>
          <Text style={styles.remainingNumber}>{remaining}</Text>
          <Text style={styles.remainingLabel}>remaining</Text>
        </View>
      </View>

      {/* Bottom stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{consumed}</Text>
          <Text style={styles.statLabel}>consumed</Text>
        </View>
        <View style={[styles.stat, styles.statDivider]} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{goal}</Text>
          <Text style={styles.statLabel}>goal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  remainingNumber: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1,
  },
  remainingLabel: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
    marginTop: -2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#3a3d45',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
