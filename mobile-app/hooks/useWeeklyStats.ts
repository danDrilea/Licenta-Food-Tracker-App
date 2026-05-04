import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export function useWeeklyStats() {
  const db = useSQLiteContext();
  const [weeklyCalories, setWeeklyCalories] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [streak, setStreak] = useState<number>(0);
  const [isFrozen, setIsFrozenState] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const localNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
      const todayStr = localNow.toISOString().split('T')[0];
      
      // 1. Calculate Weekly Calories (last 7 days)
      const last7Days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
      }

      const calorieResults = await Promise.all(
        last7Days.map(date => 
          db.getFirstAsync<{ total: number }>(
            'SELECT SUM(calories) as total FROM food_entries WHERE date = ?',
            [date]
          )
        )
      );
      setWeeklyCalories(calorieResults.map(r => r?.total || 0));

      // 2. Calculate Streak with 1 Grace Day
      let currentStreak = 0;
      let missesAllowed = 1;
      let isFrozenStatus = false;
      
      // Check today first
      const todayResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM food_entries WHERE date = ?',
        [todayStr]
      );
      
      const hasLoggedToday = todayResult && todayResult.count > 0;
      
      // We are "Frozen" ONLY if we haven't logged today yet
      if (!hasLoggedToday) {
        isFrozenStatus = true;
        missesAllowed = 0; // Today is our grace day
      }

      // Loop back up to 365 days
      for (let i = (hasLoggedToday ? 0 : 1); i < 365; i++) {
        const checkDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const result = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM food_entries WHERE date = ?',
          [dateStr]
        );
        
        if (result && result.count > 0) {
          currentStreak++;
        } else if (missesAllowed > 0) {
          // Used grace day for a past date
          missesAllowed--;
          // We don't set isFrozenStatus to true here because the user has already "saved" the streak by logging today
        } else {
          // Streak broken
          break;
        }
      }
      
      setStreak(currentStreak);
      setIsFrozenState(isFrozenStatus);

    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  return { weeklyCalories, streak, isFrozen, refreshStats: fetchStats };
}
