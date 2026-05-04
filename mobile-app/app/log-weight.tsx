import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWeightHistory } from '../hooks/useProfile';

export default function LogWeightScreen() {
  const router = useRouter();
  const { addWeightEntry } = useWeightHistory();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = async () => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    await addWeightEntry(date, weightNum);
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Stack.Screen options={{ 
        title: 'Log Weight',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        ),
        headerStyle: { backgroundColor: '#1e2126' },
        headerTintColor: '#ffffff',
      }} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.illustration}>
          <View style={styles.iconCircle}>
            <Ionicons name="speedometer-outline" size={40} color="#c77ffb" />
          </View>
        </View>

        <Text style={styles.title}>What's your weight today?</Text>
        <Text style={styles.subtitle}>Keep track of your progress regularly.</Text>

        <View style={styles.inputGroup}>
          <View style={styles.weightInputContainer}>
            <TextInput
              style={styles.weightInput}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="0.0"
              placeholderTextColor="#4b5563"
              autoFocus
            />
            <Text style={styles.unit}>kg</Text>
          </View>
        </View>

        <View style={styles.dateSelector}>
          <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
          <Text style={styles.dateText}>{date === new Date().toISOString().split('T')[0] ? 'Today' : date}</Text>
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
    backgroundColor: '#25292e',
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
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
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
    color: '#ffffff',
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
    backgroundColor: '#1e2126',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2d35',
    marginBottom: 40,
  },
  dateText: {
    color: '#e5e7eb',
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
