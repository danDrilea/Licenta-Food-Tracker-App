import { useState, useCallback, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export interface FoodEntry {
  id: string;
  meal_id: string;
  date: string;
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function useFoodLogs(dateStr: string) {
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<FoodEntry[]>([]);

  const fetchLogs = useCallback(async () => {
    try {
      console.log(`[useFoodLogs] Fetching logs from SQLite for date: "${dateStr}"`);
      const result = await db.getAllAsync<FoodEntry>(
        'SELECT * FROM food_entries WHERE date = ?',
        [dateStr]
      );
      console.log(`[useFoodLogs] Fetched ${result.length} food entries for date: "${dateStr}"`);
      setLogs(result);
    } catch (error) {
      console.error('Error fetching food logs:', error);
    }
  }, [db, dateStr]);

  useFocusEffect(
    useCallback(() => {
      console.log(`[useFoodLogs] Screen focused, triggering fetchLogs for: "${dateStr}"`);
      fetchLogs();
    }, [fetchLogs])
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('food_logs_changed', () => {
      console.log(`[useFoodLogs] Received "food_logs_changed" event. Refetching logs for: "${dateStr}"`);
      fetchLogs();
    });
    return () => {
      console.log(`[useFoodLogs] Cleaning up "food_logs_changed" listener for: "${dateStr}"`);
      subscription.remove();
    };
  }, [fetchLogs]);

  const addFoodLog = async (entry: Omit<FoodEntry, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15);
    try {
      await db.runAsync(
        'INSERT INTO food_entries (id, meal_id, date, name, amount, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, entry.meal_id, entry.date, entry.name, entry.amount, entry.calories, entry.protein, entry.carbs, entry.fat]
      );
      await fetchLogs();
    } catch (error) {
      console.error('Error adding food log:', error);
    }
  };

  const updateFoodLog = async (id: string, entry: Omit<FoodEntry, 'id'>) => {
    try {
      await db.runAsync(
        'UPDATE food_entries SET meal_id = ?, date = ?, name = ?, amount = ?, calories = ?, protein = ?, carbs = ?, fat = ? WHERE id = ?',
        [entry.meal_id, entry.date, entry.name, entry.amount, entry.calories, entry.protein, entry.carbs, entry.fat, id]
      );
      await fetchLogs();
    } catch (error) {
      console.error('Error updating food log:', error);
    }
  };

  const deleteFoodLog = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM food_entries WHERE id = ?', [id]);
      await fetchLogs();
    } catch (error) {
      console.error('Error deleting food log:', error);
    }
  };

  return {
    logs,
    addFoodLog,
    updateFoodLog,
    deleteFoodLog,
    refreshLogs: fetchLogs,
  };
}
