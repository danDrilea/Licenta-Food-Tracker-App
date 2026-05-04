import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export function useWeeklyStats() {
  const db = useSQLiteContext();
  const [weeklyCalories, setWeeklyCalories] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [streak, setStreak] = useState<number>(0);

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date();
      const last7Days: string[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        last7Days.push(localDate.toISOString().split('T')[0]);
      }

      // 1. Calculate Weekly Calories
      const calorieResults = await Promise.all(
        last7Days.map(date => 
          db.getFirstAsync<{ total: number }>(
            'SELECT SUM(calories) as total FROM food_entries WHERE date = ?',
            [date]
          )
        )
      );
      setWeeklyCalories(calorieResults.map(r => r?.total || 0));

      // 2. Calculate Streak (consecutive days with logs backwards from today)
      let currentStreak = 0;
      let checkDate = new Date();
      
      while (true) {
        const offset = checkDate.getTimezoneOffset();
        const localDate = new Date(checkDate.getTime() - (offset * 60 * 1000));
        const dateStr = localDate.toISOString().split('T')[0];
        
        const result = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM food_entries WHERE date = ?',
          [dateStr]
        );
        
        if (result && result.count > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // If it's today and no logs, streak might still be alive from yesterday
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          if (isToday) {
             checkDate.setDate(checkDate.getDate() - 1);
             continue; // Check yesterday
          }
          break;
        }
        
        if (currentStreak > 365) break; // Safety break
      }
      setStreak(currentStreak);

    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  return { weeklyCalories, streak, refreshStats: fetchStats };
}
