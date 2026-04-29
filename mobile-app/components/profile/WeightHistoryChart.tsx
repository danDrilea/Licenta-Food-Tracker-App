import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Rect, Line, Circle as SvgCircle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WeightEntry } from '../../types/profile';

interface WeightHistoryChartProps {
  entries: WeightEntry[];
  onLogWeight?: () => void;
}

const CHART_HEIGHT = 100;
const DOT_RADIUS = 4;

export default function WeightHistoryChart({ entries, onLogWeight }: WeightHistoryChartProps) {
  const hasData = entries.length > 1;

  // Take last 10 entries for display
  const displayEntries = entries.slice(-10);
  const weights = displayEntries.map((e) => e.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  const chartWidth = Math.max(displayEntries.length * 40, 200);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Weight History</Text>
        <Pressable
          style={({ pressed }) => [styles.logBtn, pressed && styles.logBtnPressed]}
          onPress={onLogWeight}
        >
          <Ionicons name="add-circle" size={18} color="#8b5cf6" />
          <Text style={styles.logBtnText}>Log Weight</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        {hasData ? (
          <>
            {/* Latest weight highlight */}
            <View style={styles.latestRow}>
              <Text style={styles.latestWeight}>{weights[weights.length - 1]} kg</Text>
              <Text style={styles.latestDate}>
                {formatDate(displayEntries[displayEntries.length - 1].date)}
              </Text>
            </View>

            {/* Chart */}
            <View style={styles.chartWrapper}>
              <Svg width={chartWidth} height={CHART_HEIGHT + 20} style={styles.svg}>
                {/* Connect dots with lines */}
                {displayEntries.map((entry, i) => {
                  if (i === 0) return null;
                  const prevX = (i - 1) * 40 + 20;
                  const prevY = CHART_HEIGHT - ((weights[i - 1] - minW) / range) * CHART_HEIGHT + 10;
                  const currX = i * 40 + 20;
                  const currY = CHART_HEIGHT - ((weights[i] - minW) / range) * CHART_HEIGHT + 10;

                  return (
                    <Line
                      key={`line-${i}`}
                      x1={prevX}
                      y1={prevY}
                      x2={currX}
                      y2={currY}
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      opacity={0.6}
                    />
                  );
                })}

                {/* Dots */}
                {displayEntries.map((entry, i) => {
                  const x = i * 40 + 20;
                  const y = CHART_HEIGHT - ((weights[i] - minW) / range) * CHART_HEIGHT + 10;
                  const isLast = i === displayEntries.length - 1;

                  return (
                    <SvgCircle
                      key={`dot-${i}`}
                      cx={x}
                      cy={y}
                      r={isLast ? DOT_RADIUS + 2 : DOT_RADIUS}
                      fill={isLast ? '#c77ffb' : '#8b5cf6'}
                      stroke={isLast ? '#1e2126' : 'none'}
                      strokeWidth={isLast ? 2 : 0}
                    />
                  );
                })}
              </Svg>

              {/* Date labels */}
              <View style={[styles.dateLabels, { width: chartWidth }]}>
                {displayEntries.map((entry, i) => (
                  <Text key={i} style={[styles.dateLabel, { width: 40 }]}>
                    {shortDate(entry.date)}
                  </Text>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={32} color="#4b5563" />
            <Text style={styles.emptyText}>Log your weight to see trends</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  logBtnPressed: {
    opacity: 0.7,
  },
  logBtnText: {
    color: '#8b5cf6',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  latestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  latestWeight: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  latestDate: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  chartWrapper: {
    alignItems: 'center',
  },
  svg: {
    overflow: 'visible',
  },
  dateLabels: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dateLabel: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '500',
  },
});
