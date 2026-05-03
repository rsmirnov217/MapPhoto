import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'markers.db';

export const getDatabase = (): SQLite.SQLiteDatabase => {
  return SQLite.openDatabaseSync(DATABASE_NAME);
};

export const initDatabaseTables = (db: SQLite.SQLiteDatabase): void => {
  // Создание таблицы маркеров
  db.execSync(`
    CREATE TABLE IF NOT EXISTS markers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Создание таблицы изображений
  db.execSync(`
    CREATE TABLE IF NOT EXISTS marker_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marker_id INTEGER NOT NULL,
      uri TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
    );
  `);
  
  // Создание индексов
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_marker_images_marker_id 
    ON marker_images(marker_id);
  `);
  

};

