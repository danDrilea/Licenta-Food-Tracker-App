import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useWeightHistory } from '../hooks/useProfile';
import { useThemeColors } from '../types/theme';
import { getLocalDateStr } from '../types/utils';

export default function LogWeightScreen() {
  const router = useRouter();
  const { addWeightEntry } = useWeightHistory();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(getLocalDateStr());
  const theme = useThemeColors();

  const handleSave = async () => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await addWeightEntry(date, weightNum);
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Stack.Screen options={{ 
        title: 'Log Weight',
        headerLeft: () => (
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        ),
        headerStyle: { backgroundColor: theme.cardBg },
        headerTintColor: theme.textPrimary,
      }} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.illustration}>
          <View style={styles.iconCircle}>
            <Ionicons name="speedometer-outline" size={40} color="#c77ffb" />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>What's your weight today?</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Keep track of your progress regularly.</Text>

        <View style={styles.inputGroup}>
          <View style={styles.weightInputContainer}>
            <TextInput
              style={[styles.weightInput, { color: theme.textPrimary }]}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="0.0"
              placeholderTextColor={theme.textDimmer}
              autoFocus
            />
            <Text style={styles.unit}>kg</Text>
          </View>
        </View>

        <View style={[styles.dateSelector, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name="calendar-outline" size={18} color={theme.textMuted} />
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>{date === getLocalDateStr() ? 'Today' : date}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, (!weight || parseFloat(weight) <= 0) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!weight || parseFloat(weight) <= 0}
        >
          <Text style={styles.saveButtonText}>Save Progress</Text>
        </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  illustration: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(199, 127, 251, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputGroup: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  weightInput: {
    fontSize: 64,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 120,
  },
  unit: {
    color: '#c77ffb',
    fontSize: 24,
    fontWeight: '700',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 40,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#374151',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
