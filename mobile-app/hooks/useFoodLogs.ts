import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MealData } from '../components/journal/MealSection';

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
      const result = await db.getAllAsync<FoodEntry>(
        'SELECT * FROM food_entries WHERE date = ?',
        [dateStr]
      );
      setLogs(result);
    } catch (error) {
      console.error('Error fetching food logs:', error);
    }
  }, [db, dateStr]);

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [fetchLogs])
  );

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
    deleteFoodLog,
    refreshLogs: fetchLogs,
  };
}
