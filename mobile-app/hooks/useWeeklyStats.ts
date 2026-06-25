import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getLocalDateStr } from '../types/utils';

export function useWeeklyStats() {
  const db = useSQLiteContext();
  const [weeklyCalories, setWeeklyCalories] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [streak, setStreak] = useState<number>(0);
  const [isFrozen, setIsFrozenState] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const todayStr = getLocalDateStr(now);
      
      // 1. Calculate Weekly Calories (last 7 days)
      const last7Days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        last7Days.push(getLocalDateStr(d));
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
      
      // Fetch all dates with entries in the last year
      const oneYearAgo = new Date(now);
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      const oneYearAgoStr = getLocalDateStr(oneYearAgo);

      const historyRows = await db.getAllAsync<{ date: string }>(
        'SELECT DISTINCT date FROM food_entries WHERE date >= ? ORDER BY date DESC',
        [oneYearAgoStr]
      );
      
      const loggedDates = new Set(historyRows.map(r => r.date));
      const hasLoggedToday = loggedDates.has(todayStr);
      
      // We are "Frozen" ONLY if we haven't logged today yet
      if (!hasLoggedToday) {
        isFrozenStatus = true;
        missesAllowed = 0; // Today is our grace day
      }

      // Loop back up to 365 days
      for (let i = (hasLoggedToday ? 0 : 1); i < 365; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = getLocalDateStr(checkDate);
        
        const hasLoggedOnDate = loggedDates.has(dateStr);
        
        if (hasLoggedOnDate) {
          currentStreak++;
        } else {
          if (missesAllowed > 0) {
            missesAllowed--; // Use grace day
          } else {
            break; // Streak broken
          }
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
