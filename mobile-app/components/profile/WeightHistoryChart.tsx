import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Svg, { Rect, Line, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { WeightEntry } from '../../types/profile';
import { useThemeColors } from '../../types/theme';

interface WeightHistoryChartProps {
  entries: WeightEntry[];
  onLogWeight?: () => void;
}

const CHART_HEIGHT = 120;
const DOT_RADIUS = 4;
const COLUMN_WIDTH = 50; // Increased for better breathing room

export default function WeightHistoryChart({ entries, onLogWeight }: WeightHistoryChartProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useThemeColors();

  // Take last 30 entries for a better trend view
  const displayEntries = useMemo(() => {
    return [...entries].reverse().slice(-30);
  }, [entries]);

  const hasData = displayEntries.length > 1;
  const weights = displayEntries.map((e) => e.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  const chartWidth = Math.max(displayEntries.length * COLUMN_WIDTH, 200);

  // Auto-scroll to the end (latest weight) when data loads
  useEffect(() => {
    if (hasData) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [hasData]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Weight History</Text>
        <Pressable
          style={({ pressed }) => [styles.logBtn, pressed && styles.logBtnPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onLogWeight?.();
          }}
        >
          <Ionicons name="add-circle" size={18} color="#8b5cf6" />
          <Text style={styles.logBtnText}>Log Weight</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        {hasData ? (
          <>
            {/* Latest weight highlight */}
            <View style={styles.latestRow}>
              <Text style={[styles.latestWeight, { color: theme.textPrimary }]}>{weights[weights.length - 1]} kg</Text>
              <Text style={[styles.latestDate, { color: theme.textDim }]}>
                {formatDate(displayEntries[displayEntries.length - 1].date)}
              </Text>
            </View>

            {/* Scrollable Chart */}
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartScrollContent}
            >
              <View style={styles.chartWrapper}>
                <Svg width={chartWidth} height={CHART_HEIGHT + 30} style={styles.svg}>
                  {/* Connect dots with lines */}
                  {displayEntries.map((entry, i) => {
                    if (i === 0) return null;
                    const prevX = (i - 1) * COLUMN_WIDTH + 25;
                    const prevY = CHART_HEIGHT - ((weights[i - 1] - minW) / range) * CHART_HEIGHT + 15;
                    const currX = i * COLUMN_WIDTH + 25;
                    const currY = CHART_HEIGHT - ((weights[i] - minW) / range) * CHART_HEIGHT + 15;

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

                {/* Dots and Labels */}
                {displayEntries.map((entry, i) => {
                  const x = i * COLUMN_WIDTH + 25;
                  const y = CHART_HEIGHT - ((weights[i] - minW) / range) * CHART_HEIGHT + 15;
                  const isLast = i === displayEntries.length - 1;

                  return (
                    <React.Fragment key={`point-${i}`}>
                      {/* Weight Label */}
                      <SvgText
                        x={x}
                        y={y - 10}
                        fontSize="10"
                        fill={isLast ? theme.textPrimary : theme.textMuted}
                        fontWeight={isLast ? '800' : '500'}
                        textAnchor="middle"
                      >
                        {weights[i]}
                      </SvgText>

                      <SvgCircle
                        cx={x}
                        cy={y}
                        r={isLast ? DOT_RADIUS + 2 : DOT_RADIUS}
                        fill={isLast ? '#c77ffb' : '#8b5cf6'}
                        stroke={isLast ? theme.cardBg : 'none'}
                        strokeWidth={isLast ? 2 : 0}
                      />
                    </React.Fragment>
                  );
                })}
              </Svg>

              {/* Date labels */}
              <View style={[styles.dateLabels, { width: chartWidth }]}>
                {displayEntries.map((entry, i) => (
                  <Text key={i} style={[styles.dateLabel, { width: COLUMN_WIDTH, color: theme.textDim }]}>
                    {shortDate(entry.date)}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={32} color={theme.textDimmer} />
          <Text style={[styles.emptyText, { color: theme.textDimmer }]}>Log your weight to see trends</Text>
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
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  latestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  latestWeight: {
    fontSize: 22,
    fontWeight: '700',
  },
  latestDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartScrollContent: {
    paddingHorizontal: 10,
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
    fontSize: 13,
    fontWeight: '500',
  },
});
