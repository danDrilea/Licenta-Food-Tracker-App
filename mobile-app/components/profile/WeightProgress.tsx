import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WeightProgressProps {
  currentWeight: number;
  targetWeight: number;
  startWeight?: number; // weight when goal was set
}

export default function WeightProgress({ currentWeight, targetWeight, startWeight }: WeightProgressProps) {
  const start = startWeight ?? (targetWeight > currentWeight ? currentWeight - 5 : currentWeight + 5);
  const totalRange = Math.abs(targetWeight - start);
  const progress = totalRange > 0
    ? Math.min(Math.max(Math.abs(currentWeight - start) / totalRange, 0), 1)
    : 0;

  const isGaining = targetWeight > start;

  // Determine if the user has reached or passed their goal
  const reachedGoal = isGaining
    ? currentWeight >= targetWeight
    : currentWeight <= targetWeight;

  const remaining = Math.abs(targetWeight - currentWeight).toFixed(1);

  // Determine the correct action verb based on where the user actually needs to go
  const getStatusText = () => {
    if (reachedGoal) return 'Goal reached! 🎯';
    
    const needsToGain = targetWeight > currentWeight;
    return `${remaining} kg to ${needsToGain ? 'gain' : 'lose'}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Weight Progress</Text>

      <View style={styles.card}>
        {/* Progress bar */}
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.min(progress, 1) * 100}%`, backgroundColor: reachedGoal ? '#4ade80' : '#8b5cf6' }]} />
          {/* Current marker */}
          <View style={[styles.marker, { left: `${Math.min(progress, 1) * 100}%` }]}>
            <View style={[styles.markerDot, reachedGoal && { backgroundColor: '#4ade80', borderColor: '#1e2126' }]} />
          </View>
        </View>

        {/* Labels */}
        <View style={styles.labelsRow}>
          <View style={styles.labelBlock}>
            <Text style={styles.labelValue}>{start} kg</Text>
            <Text style={styles.labelCaption}>start</Text>
          </View>

          <View style={styles.labelBlockCenter}>
            <Text style={styles.currentValue}>{currentWeight} kg</Text>
            <Text style={styles.labelCaption}>current</Text>
          </View>

          <View style={[styles.labelBlock, { alignItems: 'flex-end' }]}>
            <Text style={styles.labelValue}>{targetWeight} kg</Text>
            <Text style={styles.labelCaption}>goal</Text>
          </View>
        </View>

        {/* Remaining */}
        <View style={styles.remainingRow}>
          <Text style={styles.remainingText}>
            {reachedGoal ? (
              <Text style={[styles.remainingNumber, { color: '#4ade80' }]}>{getStatusText()}</Text>
            ) : (
              <>
                <Text style={styles.remainingNumber}>{remaining} kg </Text>
                {targetWeight > currentWeight ? 'to gain' : 'to lose'}
              </>
            )}
          </Text>
          <Text style={[styles.percentText, reachedGoal && { color: '#4ade80' }]}>
            {reachedGoal ? '100%' : `${Math.round(progress * 100)}%`} there
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  barTrack: {
    height: 10,
    backgroundColor: '#2a2d35',
    borderRadius: 5,
    overflow: 'visible',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#8b5cf6',
  },
  marker: {
    position: 'absolute',
    top: -4,
    marginLeft: -9,
  },
  markerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#c77ffb',
    borderWidth: 3,
    borderColor: '#1e2126',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  labelBlock: {
    alignItems: 'flex-start',
  },
  labelBlockCenter: {
    alignItems: 'center',
  },
  labelValue: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  currentValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  labelCaption: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2d35',
  },
  remainingText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
  },
  remainingNumber: {
    color: '#ffffff',
    fontWeight: '700',
  },
  percentText: {
    color: '#8b5cf6',
    fontSize: 13,
    fontWeight: '600',
  },
});
