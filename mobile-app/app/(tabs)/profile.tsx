import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { UserProfile } from '../../types/profile';
import ProfileHeader from '../../components/profile/ProfileHeader';
import UserInfoSection from '../../components/profile/UserInfoSection';
import GoalSection from '../../components/profile/GoalSection';
import WeightProgress from '../../components/profile/WeightProgress';
import HealthIndexes from '../../components/profile/HealthIndexes';
import WeightHistoryChart from '../../components/profile/WeightHistoryChart';

// ─── Mock user (will be replaced with real state/API) ───────────────
const MOCK_USER: UserProfile = {
  firstName: 'Dan',
  lastName: 'Drilea',
  dateOfBirth: '1999-06-15',
  country: 'Romania',
  sex: 'male',
  heightCm: 180,
  currentWeightKg: 82,
  activityLevel: 'moderately_active',
  goal: {
    type: 'weight_loss',
    targetWeight: 75,
    weeklyRate: 0.5,
  },
  weightHistory: [
    { date: '2026-03-01', weight: 88.0 },
    { date: '2026-03-08', weight: 87.2 },
    { date: '2026-03-15', weight: 86.5 },
    { date: '2026-03-22', weight: 85.8 },
    { date: '2026-03-29', weight: 85.0 },
    { date: '2026-04-05', weight: 84.3 },
    { date: '2026-04-12', weight: 83.5 },
    { date: '2026-04-19', weight: 82.8 },
    { date: '2026-04-26', weight: 82.0 },
  ],
};

export default function ProfileScreen() {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Profile avatar + name */}
      <ProfileHeader
        firstName={MOCK_USER.firstName}
        lastName={MOCK_USER.lastName}
        onEditPress={() => console.log('Edit avatar')}
      />

      {/* 2. User info */}
      <View style={styles.section}>
        <UserInfoSection
          user={MOCK_USER}
          onEditPress={() => console.log('Edit user info → navigate to edit flow')}
        />
      </View>

      {/* 3. Goal */}
      <View style={styles.section}>
        <GoalSection
          goal={MOCK_USER.goal}
          currentWeight={MOCK_USER.currentWeightKg}
          onEditPress={() => console.log('Edit goal → navigate to goal flow')}
        />
      </View>

      {/* 4. Weight progress */}
      <View style={styles.section}>
        <WeightProgress
          currentWeight={MOCK_USER.currentWeightKg}
          targetWeight={MOCK_USER.goal.targetWeight!}
          startWeight={MOCK_USER.weightHistory[0]?.weight}
        />
      </View>

      {/* 5. Health indexes */}
      <View style={styles.section}>
        <HealthIndexes user={MOCK_USER} />
      </View>

      {/* 6. Weight history chart */}
      <View style={styles.section}>
        <WeightHistoryChart
          entries={MOCK_USER.weightHistory}
          onLogWeight={() => console.log('Log weight → open weight input')}
        />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginTop: 12,
  },
  bottomSpacer: {
    height: 30,
  },
});
