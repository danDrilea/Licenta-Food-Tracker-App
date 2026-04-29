import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// ─── Reusable Row Components ────────────────────────────────────────

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  right?: React.ReactNode;
}

export function SettingsRow({ icon, iconColor = '#8b5cf6', label, value, onPress, isLast, right }: SettingsRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && onPress && styles.rowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress && !right}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>

      <View style={styles.rowRight}>
        {right || (
          <>
            {value && <Text style={styles.rowValue}>{value}</Text>}
            {onPress && <Ionicons name="chevron-forward" size={16} color="#4b5563" />}
          </>
        )}
      </View>
    </Pressable>
  );
}

interface SettingsToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  isLast?: boolean;
}

export function SettingsToggleRow({ icon, iconColor = '#8b5cf6', label, value, onToggle, isLast }: SettingsToggleRowProps) {
  return (
    <SettingsRow
      icon={icon}
      iconColor={iconColor}
      label={label}
      isLast={isLast}
      right={
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#2a2d35', true: '#8b5cf680' }}
          thumbColor={value ? '#8b5cf6' : '#6b7280'}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 20,
  },
  groupTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d35',
  },
  rowPressed: {
    backgroundColor: '#2a2d35',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
