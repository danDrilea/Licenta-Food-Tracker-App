import * as SQLite from 'expo-sqlite';

export async function initDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // CLEANUP: Drop old tables once to reset schema
  // await db.execAsync('DROP TABLE IF EXISTS food_entries;');
  // await db.execAsync('DROP TABLE IF EXISTS daily_logs;');
  // await db.execAsync('DROP TABLE IF EXISTS profile;');
  // await db.execAsync('DROP TABLE IF EXISTS weight_history;');
  // await db.execAsync('DROP TABLE IF EXISTS settings;');
  // await db.execAsync('DROP TABLE IF EXISTS meal_slots;');
  // await db.execAsync('DROP TABLE IF EXISTS daily_goals;');

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
      activity_level TEXT,
      goal_type TEXT,
      target_weight REAL,
      weekly_rate REAL
    );

    CREATE TABLE IF NOT EXISTS weight_history (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meal_slots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_goals (
      id INTEGER PRIMARY KEY DEFAULT 1,
      calories INTEGER DEFAULT 2000,
      protein REAL DEFAULT 150,
      carbs REAL DEFAULT 250,
      fat REAL DEFAULT 70,
      water_glasses INTEGER DEFAULT 8
    );
  `);

  // Initialize profile with a default row if it doesn't exist
  await db.runAsync(`
    INSERT OR IGNORE INTO profile (id, first_name, last_name, dob, country, sex, height_cm, activity_level, goal_type, target_weight, weekly_rate)
    VALUES (1, 'New', 'User', '1990-01-01', 'Romania', 'male', 175, 'moderately_active', 'maintain', 70, 0.5)
  `);

  // Seed default meal slots if table is empty
  const mealCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM meal_slots');
  if (mealCount?.count === 0) {
    await db.runAsync("INSERT INTO meal_slots (id, name, icon, sort_order, enabled) VALUES ('breakfast', 'Breakfast', 'cafe', 0, 1)");
    await db.runAsync("INSERT INTO meal_slots (id, name, icon, sort_order, enabled) VALUES ('lunch', 'Lunch', 'fast-food', 1, 1)");
    await db.runAsync("INSERT INTO meal_slots (id, name, icon, sort_order, enabled) VALUES ('dinner', 'Dinner', 'restaurant', 2, 1)");
    await db.runAsync("INSERT INTO meal_slots (id, name, icon, sort_order, enabled) VALUES ('snacks', 'Snacks', 'ice-cream', 3, 1)");
  }

  // Seed default goals if table is empty
  const goalCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM daily_goals');
  if (goalCount?.count === 0) {
    await db.runAsync("INSERT INTO daily_goals (id, calories, protein, carbs, fat, water_glasses) VALUES (1, 2000, 150, 250, 70, 8)");
  }

  // Seed default settings if empty
  const settingsCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM settings');
  if (settingsCount?.count === 0) {
    await db.runAsync("INSERT INTO settings (key, value) VALUES ('theme', 'dark')");
    await db.runAsync("INSERT INTO settings (key, value) VALUES ('weightUnit', 'kg')");
    await db.runAsync("INSERT INTO settings (key, value) VALUES ('heightUnit', 'cm')");
    await db.runAsync("INSERT INTO settings (key, value) VALUES ('energyUnit', 'kcal')");
  }
}
