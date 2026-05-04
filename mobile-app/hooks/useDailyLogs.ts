import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export interface DailyLog {
  date: string;
  water_glasses: number;
}

export function useDailyLogs(dateStr: string) {
  const db = useSQLiteContext();
  const [waterGlasses, setWaterGlassesState] = useState<number>(0);

  const fetchLog = useCallback(async () => {
    try {
      const result = await db.getFirstAsync<DailyLog>(
        'SELECT * FROM daily_logs WHERE date = ?',
        [dateStr]
      );
      if (result) {
        setWaterGlassesState(result.water_glasses);
      } else {
        setWaterGlassesState(0);
      }
    } catch (error) {
      console.error('Error fetching daily log:', error);
    }
  }, [db, dateStr]);

  useFocusEffect(
    useCallback(() => {
      fetchLog();
    }, [fetchLog])
  );

  const setWaterGlasses = async (glasses: number) => {
    try {
      // Upsert: update if exists, insert if not
      await db.runAsync(
        `INSERT INTO daily_logs (date, water_glasses) VALUES (?, ?)
         ON CONFLICT(date) DO UPDATE SET water_glasses = excluded.water_glasses`,
        [dateStr, glasses]
      );
      setWaterGlassesState(glasses);
    } catch (error) {
      console.error('Error updating water glasses:', error);
    }
  };

  return {
    waterGlasses,
    setWaterGlasses,
    refreshLog: fetchLog,
  };
}
