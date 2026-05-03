import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'markers.db';
const DATABASE_VERSION = 1;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  return SQLite.openDatabaseSync(DATABASE_NAME);
};

// Функция миграции
const migrateToVersion = (db: SQLite.SQLiteDatabase, fromVersion: number) => {
  if (fromVersion < 1) {
    // Миграция на версию 1
    initDatabaseTables(db);
  }
  // Добавьте миграции для следующих версий
  // if (fromVersion < 2) { ... }
};

export const checkAndMigrate = (db: SQLite.SQLiteDatabase): void => {
  try {
    // Получаем версию БД правильным способом
    const result = db.getFirstSync<{ user_version: number }>('PRAGMA user_version;');
    const currentVersion = result?.user_version || 0;
    
    console.log('Текущая версия БД:', currentVersion);
    console.log('Целевая версия БД:', DATABASE_VERSION);
    
    if (currentVersion === 0) {
      // Первая инициализация
      console.log('Первая инициализация БД...');
      initDatabaseTables(db);
      db.execSync(`PRAGMA user_version = ${DATABASE_VERSION};`);
      console.log('БД инициализирована, версия установлена:', DATABASE_VERSION);
    } else if (currentVersion < DATABASE_VERSION) {
      // Требуется миграция
      console.log(`Миграция БД с версии ${currentVersion} на ${DATABASE_VERSION}...`);
      migrateToVersion(db, currentVersion);
      db.execSync(`PRAGMA user_version = ${DATABASE_VERSION};`);
      console.log('Миграция завершена');
    }
  } catch (error) {
    console.error('Ошибка при проверке/миграции БД:', error);
    throw error;
  }
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

