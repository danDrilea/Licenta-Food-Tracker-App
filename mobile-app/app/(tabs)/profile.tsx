import React from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { UserProfile, WeightEntry } from '../../types/profile';
import ProfileHeader from '../../components/profile/ProfileHeader';
import UserInfoSection from '../../components/profile/UserInfoSection';
import GoalSection from '../../components/profile/GoalSection';
import WeightProgress from '../../components/profile/WeightProgress';
import HealthIndexes from '../../components/profile/HealthIndexes';
import WeightHistoryChart from '../../components/profile/WeightHistoryChart';
import { useProfile, useWeightHistory } from '../../hooks/useProfile';

export default function ProfileScreen() {
  const { profile } = useProfile();
  const { history } = useWeightHistory();

  if (!profile) {
    return (
      <View style={[styles.scrollView, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#ffffff' }}>Loading profile...</Text>
      </View>
    );
  }

  // Inject history into profile for components that expect it
  const user: UserProfile = {
    ...profile,
    weightHistory: history,
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Profile avatar + name */}
      <ProfileHeader
        firstName={user.firstName}
        lastName={user.lastName}
        onEditPress={() => console.log('Edit avatar')}
      />

      {/* 2. User info */}
      <View style={styles.section}>
        <UserInfoSection
          user={user}
          onEditPress={() => console.log('Edit user info → navigate to edit flow')}
        />
      </View>

      {/* 3. Goal */}
      <View style={styles.section}>
        <GoalSection
          goal={user.goal}
          currentWeight={user.currentWeightKg}
          onEditPress={() => console.log('Edit goal → navigate to goal flow')}
        />
      </View>

      {/* 4. Weight progress */}
      <View style={styles.section}>
        <WeightProgress
          currentWeight={user.currentWeightKg}
          targetWeight={user.goal.targetWeight!}
          startWeight={user.weightHistory[user.weightHistory.length - 1]?.weight || user.currentWeightKg}
        />
      </View>

      {/* 5. Health indexes */}
      <View style={styles.section}>
        <HealthIndexes user={user} />
      </View>

      {/* 6. Weight history chart */}
      <View style={styles.section}>
        <WeightHistoryChart
          entries={user.weightHistory}
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
