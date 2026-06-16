import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Text, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { UserProfile, WeightEntry } from '../../types/profile';
import ProfileHeader from '../../components/profile/ProfileHeader';
import UserInfoSection from '../../components/profile/UserInfoSection';
import GoalSection from '../../components/profile/GoalSection';
import WeightProgress from '../../components/profile/WeightProgress';
import HealthIndexes from '../../components/profile/HealthIndexes';
import WeightHistoryChart from '../../components/profile/WeightHistoryChart';
import { useProfile, useWeightHistory } from '../../hooks/useProfile';
import { useThemeColors } from '../../types/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { profile } = useProfile();
  const { history } = useWeightHistory();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const colors = useThemeColors();

  // Load avatar from DB
  const loadAvatar = useCallback(async () => {
    try {
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['avatarUri']);
      if (row) setAvatarUri(row.value);
    } catch (e) {
      console.error('Failed to load avatar:', e);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadAvatar();
    }, [loadAvatar])
  );

  const handlePickImage = async () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => processImage('camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => processImage('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const processImage = async (type: 'camera' | 'library') => {
    const { status } = type === 'camera' 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', `Please allow access to your ${type === 'camera' ? 'camera' : 'photos'} to change your profile picture.`);
      return;
    }

    const result = type === 'camera'
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      // Save to DB
      try {
        await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['avatarUri', uri]);
      } catch (e) {
        console.error('Failed to save avatar URI:', e);
      }
    }
  };

  if (!profile) {
    return (
      <View style={[styles.scrollView, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textPrimary }}>Loading profile...</Text>
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
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Profile avatar + name */}
      <ProfileHeader
        firstName={user.firstName}
        lastName={user.lastName}
        avatarUri={avatarUri}
        onEditPress={handlePickImage}
      />

      {/* 2. User info */}
      <View style={styles.section}>
        <UserInfoSection
          user={user}
          onEditPress={() => router.push('/edit-profile')}
        />
      </View>

      {/* 3. Goal */}
      <View style={styles.section}>
        <GoalSection
          goal={user.goal}
          currentWeight={user.currentWeightKg}
          onEditPress={() => router.push('/edit-goal')}
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
          onLogWeight={() => router.push('/log-weight')}
        />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
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
