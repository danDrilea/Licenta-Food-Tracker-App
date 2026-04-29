import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';

interface WeeklyChartProps {
  data: number[];
  goal: number;
  labels?: string[];
}

const CHART_HEIGHT = 140;
const BAR_WIDTH = 28;
const BAR_RADIUS = 6;

const DEFAULT_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyChart({ data, goal, labels = DEFAULT_LABELS }: WeeklyChartProps) {
  const maxValue = Math.max(...data, goal) * 1.15;
  const chartWidth = data.length * (BAR_WIDTH + 16);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Weekly Overview</Text>

      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={CHART_HEIGHT + 30} style={styles.svg}>
          {/* Goal line */}
          <Line
            x1={0}
            y1={CHART_HEIGHT - (goal / maxValue) * CHART_HEIGHT}
            x2={chartWidth}
            y2={CHART_HEIGHT - (goal / maxValue) * CHART_HEIGHT}
            stroke="#8b5cf6"
            strokeWidth={1}
            strokeDasharray="6,4"
            opacity={0.5}
          />

          {/* Bars */}
          {data.map((value, i) => {
            const barHeight = value > 0 ? Math.max((value / maxValue) * CHART_HEIGHT, 4) : 0;
            const x = i * (BAR_WIDTH + 16) + 8;
            const y = CHART_HEIGHT - barHeight;
            const isOverGoal = value > goal;
            const isFuture = value === 0 && i >= new Date().getDay();

            return (
              <React.Fragment key={i}>
                {/* Bar background */}
                <Rect
                  x={x}
                  y={4}
                  width={BAR_WIDTH}
                  height={CHART_HEIGHT - 4}
                  rx={BAR_RADIUS}
                  fill="#2a2d35"
                  opacity={0.5}
                />
                {/* Bar fill */}
                {barHeight > 0 && (
                  <Rect
                    x={x}
                    y={y}
                    width={BAR_WIDTH}
                    height={barHeight}
                    rx={BAR_RADIUS}
                    fill={isOverGoal ? '#ef4444' : '#8b5cf6'}
                    opacity={0.85}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Day labels */}
        <View style={[styles.labelRow, { width: chartWidth }]}>
          {labels.map((label, i) => (
            <Text
              key={label}
              style={[
                styles.dayLabel,
                { width: BAR_WIDTH + 16 },
                data[i] === 0 && styles.dayLabelDim,
              ]}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
          <Text style={styles.legendText}>Under goal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Over goal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendLine} />
          <Text style={styles.legendText}>Goal ({goal})</Text>
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
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  svg: {
    overflow: 'visible',
  },
  labelRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  dayLabel: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  dayLabelDim: {
    color: '#4b5563',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 14,
    height: 0,
    borderTopWidth: 2,
    borderTopColor: '#8b5cf6',
    borderStyle: 'dashed',
  },
  legendText: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '500',
  },
});
