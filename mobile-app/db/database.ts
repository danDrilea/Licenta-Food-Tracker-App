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

    CREATE TABLE IF NOT EXISTS food_classes_nutrition (
      name TEXT PRIMARY KEY,
      calories INTEGER NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS barcode_cache (
      barcode TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      serving_grams REAL,
      calories_per_100g REAL,
      protein_per_100g REAL,
      carbs_per_100g REAL,
      fat_per_100g REAL,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await db.execAsync('ALTER TABLE barcode_cache ADD COLUMN serving_grams REAL;');
    await db.execAsync('ALTER TABLE barcode_cache ADD COLUMN calories_per_100g REAL;');
    await db.execAsync('ALTER TABLE barcode_cache ADD COLUMN protein_per_100g REAL;');
    await db.execAsync('ALTER TABLE barcode_cache ADD COLUMN carbs_per_100g REAL;');
    await db.execAsync('ALTER TABLE barcode_cache ADD COLUMN fat_per_100g REAL;');
  } catch (e) {
    // Columns might already exist, ignore
  }

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
  // Unconditionally ensure country exists in settings
  await db.runAsync("INSERT OR IGNORE INTO settings (key, value) VALUES ('country', 'Romania')");

  // Seed 73 food classes nutrition info unconditionally to ensure updates apply
  {
    const entries: [string, number, number, number, number][] = [
      ['candy', 380, 0, 98, 0],
      ['french fries', 312, 3.4, 41, 15],
      ['chocolate', 546, 4.9, 61, 31],
      ['biscuit', 450, 6, 70, 16],
      ['popcorn', 375, 12, 74, 4],
      ['ice cream', 207, 3.5, 24, 11],
      ['cheese butter', 400, 15, 1, 38],
      ['cake', 389, 5, 55, 17],
      ['wine', 85, 0.1, 2.6, 0],
      ['milkshake', 112, 3.5, 20, 3],
      ['coffee', 2, 0.1, 0, 0],
      ['juice', 45, 0.5, 10, 0.1],
      ['milk', 50, 3.3, 4.8, 2],
      ['almond', 579, 21, 22, 49],
      ['cashew', 553, 18, 30, 44],
      ['dried cranberries', 308, 0.1, 83, 1.4],
      ['walnut', 654, 15, 14, 65],
      ['peanut', 567, 26, 16, 49],
      ['egg', 155, 13, 1.1, 11],
      ['apple', 52, 0.3, 14, 0.2],
      ['apricot', 48, 1.4, 11, 0.4],
      ['avocado', 160, 2, 9, 15],
      ['banana', 89, 1.1, 23, 0.3],
      ['strawberry', 32, 0.7, 8, 0.3],
      ['cherry', 50, 1, 12, 0.3],
      ['berries', 43, 0.9, 10, 0.4],
      ['mango', 60, 0.8, 15, 0.4],
      ['olives', 115, 0.8, 6, 11],
      ['peach', 39, 0.9, 10, 0.3],
      ['lemon', 29, 1.1, 9, 0.3],
      ['pear', 57, 0.4, 15, 0.1],
      ['pineapple', 50, 0.5, 13, 0.1],
      ['grape', 69, 0.7, 18, 0.2],
      ['kiwi', 61, 1.1, 15, 0.5],
      ['melon', 34, 0.8, 8, 0.2],
      ['orange', 47, 0.9, 12, 0.1],
      ['watermelon', 30, 0.6, 8, 0.2],
      ['steak', 271, 25, 0, 19],
      ['pork', 242, 26, 0, 14],
      ['chicken', 165, 31, 0, 3.6],
      ['sausage', 301, 12, 2, 27],
      ['fried meat', 290, 24, 1, 21],
      ['sauce', 120, 1.5, 10, 8],
      ['crab', 87, 18, 0, 1.1],
      ['fish', 206, 22, 0, 12],
      ['shellfish', 86, 12, 2, 1],
      ['shrimp', 99, 24, 0.2, 0.3],
      ['soup', 40, 2, 5, 1.5],
      ['bread', 265, 9, 49, 3.2],
      ['corn', 86, 3.2, 19, 1.2],
      ['hamburger', 295, 17, 30, 12],
      ['pizza', 266, 11, 33, 10],
      ['pasta', 131, 5, 25, 1.1],
      ['rice', 130, 2.7, 28, 0.3],
      ['pie', 237, 2.3, 34, 10.5],
      ['eggplant', 25, 1, 6, 0.2],
      ['potato', 87, 2, 20, 0.1],
      ['garlic', 149, 6.4, 33, 0.5],
      ['cauliflower', 25, 1.9, 5, 0.3],
      ['tomato', 18, 0.9, 3.9, 0.2],
      ['lettuce', 15, 1.4, 2.9, 0.2],
      ['pumpkin', 26, 1, 6.5, 0.1],
      ['cucumber', 15, 0.7, 3.6, 0.1],
      ['carrot', 41, 0.9, 10, 0.2],
      ['asparagus', 20, 2.2, 3.9, 0.1],
      ['broccoli', 34, 2.8, 7, 0.4],
      ['celery', 16, 0.7, 3, 0.2],
      ['cabbage', 25, 1.3, 6, 0.1],
      ['onion', 40, 1.1, 9.3, 0.1],
      ['pepper', 20, 0.9, 4.6, 0.2],
      ['green beans', 31, 1.8, 7, 0.2],
      ['mushroom', 22, 3.1, 3.3, 0.3],
      ['salad', 50, 1.5, 4, 3.5]
    ];

    await db.withTransactionAsync(async () => {
      for (const row of entries) {
        await db.runAsync(
          'INSERT OR REPLACE INTO food_classes_nutrition (name, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?)',
          row
        );
      }
    });
  }
}
