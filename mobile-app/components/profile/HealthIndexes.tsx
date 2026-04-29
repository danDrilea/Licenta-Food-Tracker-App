import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateAge,
  getBMICategory,
  UserProfile,
} from '../../types/profile';

interface HealthIndexesProps {
  user: UserProfile;
}

interface IndexCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  description: string;
  formula?: string;
}

function IndexCard({ label, value, subtitle, color = '#ffffff', description, formula }: IndexCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <View style={styles.indexCard}>
        <View style={styles.indexHeader}>
          <Text style={styles.indexLabel}>{label}</Text>
          <Pressable onPress={() => setShowInfo(true)} hitSlop={10}>
            <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
          </Pressable>
        </View>

        <Text style={[styles.indexValue, { color }]}>{value}</Text>
        {subtitle && <Text style={[styles.indexSubtitle, { color }]}>{subtitle}</Text>}
      </View>

      {/* Info Modal */}
      <Modal visible={showInfo} transparent animationType="fade" onRequestClose={() => setShowInfo(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowInfo(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setShowInfo(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#9ca3af" />
              </Pressable>
            </View>
            <Text style={styles.modalDescription}>{description}</Text>
            {formula && (
              <View style={styles.formulaBox}>
                <Text style={styles.formulaLabel}>Formula</Text>
                <Text style={styles.formulaText}>{formula}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function HealthIndexes({ user }: HealthIndexesProps) {
  const age = calculateAge(user.dateOfBirth);
  const bmi = calculateBMI(user.currentWeightKg, user.heightCm);
  const bmr = calculateBMR(user.currentWeightKg, user.heightCm, age, user.sex);
  const tdee = calculateTDEE(bmr, user.activityLevel);
  const bmiCat = getBMICategory(bmi);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Health Indexes</Text>

      <View style={styles.grid}>
        <IndexCard
          label="BMI"
          value={bmi.toString()}
          subtitle={bmiCat.label}
          color={bmiCat.color}
          description="Body Mass Index (BMI) is a measure of body fat based on your weight relative to your height. It provides a general indication of whether you're in a healthy weight range."
          formula="BMI = weight (kg) ÷ height (m)²"
        />
        <IndexCard
          label="BMR"
          value={`${bmr}`}
          subtitle="kcal/day"
          description="Basal Metabolic Rate (BMR) is the number of calories your body burns at rest to maintain basic life-sustaining functions like breathing, circulation, and cell production."
          formula="Mifflin-St Jeor: (10 × weight) + (6.25 × height) − (5 × age) ± offset"
        />
        <IndexCard
          label="TDEE"
          value={`${tdee}`}
          subtitle="kcal/day"
          description="Total Daily Energy Expenditure (TDEE) is the total number of calories you burn per day, including your BMR plus calories burned through physical activity and digestion."
          formula="TDEE = BMR × Activity Multiplier"
        />
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
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  indexCard: {
    flex: 1,
    backgroundColor: '#1e2126',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  indexHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  indexLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  indexValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  indexSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#1e2126',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalDescription: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },
  formulaBox: {
    backgroundColor: '#2a2d35',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  formulaLabel: {
    color: '#8b5cf6',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formulaText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
