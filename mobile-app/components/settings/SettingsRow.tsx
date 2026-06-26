import { View, Text, StyleSheet, Pressable, Switch, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../../types/theme';

// ─── Reusable Row Components ────────────────────────────────────────

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  const theme = useThemeColors();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{title}</Text>
      <View style={[styles.groupCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>{children}</View>
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
  const theme = useThemeColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isLast && [styles.rowBorder, { borderBottomColor: theme.border }],
        pressed && onPress && { backgroundColor: theme.rowPressed },
      ]}
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress && !right}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>

      <View style={styles.rowRight}>
        {right || (
          <>
            {value && <Text style={[styles.rowValue, { color: theme.textDim }]}>{value}</Text>}
            {onPress && <Ionicons name="chevron-forward" size={16} color={theme.textDimmer} />}
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
  const theme = useThemeColors();
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
          trackColor={{ false: theme.switchTrackOff, true: '#8b5cf680' }}
          thumbColor={value ? '#8b5cf6' : theme.textDim}
        />
      }
    />
  );
}

interface SettingsInputRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isLast?: boolean;
}

export function SettingsInputRow({
  icon,
  iconColor = '#8b5cf6',
  label,
  value,
  onChangeText,
  placeholder,
  isLast,
}: SettingsInputRowProps) {
  const theme = useThemeColors();
  return (
    <View
      style={[
        !isLast && [styles.rowBorder, { borderBottomColor: theme.border }],
        { paddingVertical: 14, paddingHorizontal: 16 }
      ]}
    >
      <View style={[styles.rowLeft, { marginBottom: 10 }]}>
        <View style={[styles.rowIcon, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>

      <TextInput
        style={{
          color: theme.textPrimary,
          fontSize: 14,
          fontWeight: '500',
          backgroundColor: theme.inputBg,
          borderColor: theme.inputBorder,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
          width: '100%',
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textDim}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
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
    fontSize: 15,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
