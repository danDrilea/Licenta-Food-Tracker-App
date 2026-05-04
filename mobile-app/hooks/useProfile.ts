import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { UserProfile, WeightEntry } from '../types/profile';

export function useProfile() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const row = await db.getFirstAsync<any>('SELECT * FROM profile WHERE id = 1');
      const latestWeight = await db.getFirstAsync<any>('SELECT weight FROM weight_history ORDER BY date DESC, created_at DESC LIMIT 1');
      
      if (row) {
        setProfile({
          firstName: row.first_name,
          lastName: row.last_name,
          dateOfBirth: row.dob,
          country: row.country,
          sex: row.sex,
          heightCm: row.height_cm,
          currentWeightKg: latestWeight?.weight || 70, // Fallback to a default if history empty
          activityLevel: row.activity_level,
          goal: {
            type: row.goal_type,
            targetWeight: row.target_weight,
            weeklyRate: row.weekly_rate,
          },
          weightHistory: [], // Fetched separately
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      await db.runAsync(
        `UPDATE profile SET 
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          height_cm = COALESCE(?, height_cm),
          sex = COALESCE(?, sex),
          activity_level = COALESCE(?, activity_level),
          dob = COALESCE(?, dob),
          country = COALESCE(?, country)
          WHERE id = 1`,
        [
          updates.firstName ?? null,
          updates.lastName ?? null,
          updates.heightCm ?? null,
          updates.sex ?? null,
          updates.activityLevel ?? null,
          updates.dateOfBirth ?? null,
          updates.country ?? null
        ]
      );
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const updateGoal = async (goal: UserProfile['goal']) => {
    try {
      await db.runAsync(
        `UPDATE profile SET goal_type = ?, target_weight = ?, weekly_rate = ? WHERE id = 1`,
        [goal.type, goal.targetWeight ?? null, goal.weeklyRate ?? null]
      );
      await fetchProfile();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  return { profile, updateProfile, updateGoal, refreshProfile: fetchProfile };
}

export function useWeightHistory() {
  const db = useSQLiteContext();
  const [history, setHistory] = useState<WeightEntry[]>([]);

  const fetchHistory = useCallback(async () => {
    try {
      const rows = await db.getAllAsync<any>('SELECT * FROM weight_history ORDER BY date DESC, created_at DESC');
      setHistory(rows.map(r => ({ date: r.date, weight: r.weight })));
    } catch (error) {
      console.error('Error fetching weight history:', error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const addWeightEntry = async (date: string, weight: number) => {
    const id = Math.random().toString(36).substring(2, 15);
    try {
      await db.runAsync(
        'INSERT INTO weight_history (id, date, weight) VALUES (?, ?, ?)',
        [id, date, weight]
      );
      await fetchHistory();
    } catch (error) {
      console.error('Error adding weight entry:', error);
    }
  };

  return { history, addWeightEntry, refreshHistory: fetchHistory };
}
