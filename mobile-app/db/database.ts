import * as SQLite from 'expo-sqlite';

export async function initDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      date TEXT PRIMARY KEY,
      water_glasses INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS food_entries (
      id TEXT PRIMARY KEY,
      meal_id TEXT NOT NULL,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      amount TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      first_name TEXT,
      last_name TEXT,
      dob TEXT,
      country TEXT,
      sex TEXT,
      height_cm REAL,
      current_weight_kg REAL,
      activity_level TEXT,
      goal_type TEXT,
      target_weight REAL,
      weekly_rate REAL
    );

    CREATE TABLE IF NOT EXISTS weight_history (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      weight REAL NOT NULL
    );
  `);

  // Initialize profile with a default row if it doesn't exist
  await db.runAsync(`
    INSERT OR IGNORE INTO profile (id, first_name, last_name, dob, country, sex, height_cm, current_weight_kg, activity_level, goal_type, target_weight, weekly_rate)
    VALUES (1, 'New', 'User', '1990-01-01', 'Romania', 'male', 175, 70, 'moderately_active', 'maintain', 70, 0.5)
  `);
}
