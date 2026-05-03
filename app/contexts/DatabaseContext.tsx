import * as SQLite from 'expo-sqlite';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  addImage as addImageOp,
  addMarker as addMarkerOp,
  deleteImage as deleteImageOp,
  deleteMarker as deleteMarkerOp,
  getMarkerImages as getMarkerImagesOp,
  getMarkers as getMarkersOp,
  updateMarker as updateMarkerOp,
} from '../database/operations';
import {
  getDatabase,
  initDatabaseTables,
} from '../database/schema';
import { DatabaseContextType, MarkerImages, Markers } from '../types';

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Инициализация базы данных и управление версиями
  const initDatabase = async (): Promise<void> => {
    try {
      const database = getDatabase();
      const targetVersion = 1; // Текущая версия схемы
      setIsReady(true);
      
        // Первая инициализация
        initDatabaseTables(database);
      
      setDb(database);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка инициализации базы данных');
      setError(error);
      throw error;
    }
  };

  useEffect(() => {
    const setupDatabase = async () => {
      setIsLoading(true);
      try {
        await initDatabase();
      } catch (err) {
        console.error('Database setup error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    setupDatabase();
  }, []);

  // Операции с базой данных
  const addMarker = async (latitude: number, longitude: number): Promise<number> => {
    if (!db) throw new Error('База данных не инициализирована');
    try {
      return await addMarkerOp(db, latitude, longitude);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка добавления маркера');
      setError(error);
      throw error;
    }
  };

  const deleteMarker = async (id: number): Promise<void> => {
    if (!db) throw new Error('База данных не инициализирована');
    try {
      await deleteMarkerOp(db, id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка удаления маркера');
      setError(error);
      throw error;
    }
  };

  const getMarkers = async (): Promise<Markers[]> => {
    if (!db) throw new Error('База данных не инициализирована');
    try {
      return await getMarkersOp(db);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка получения маркеров');
      setError(error);
      throw error;
    }
  };

  const addImage = async (markerId: number, uri: string): Promise<void> => {
    if (!db) throw new Error('База данных не инициализирована');
    try {
      await addImageOp(db, markerId, uri);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка добавления изображения');
      setError(error);
      throw error;
    }
  };

  const deleteImage = async (id: number): Promise<void> => {
    if (!db) throw new Error('База данных не инициализирована');
    try {
      await deleteImageOp(db, id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка удаления изображения');
      setError(error);
      throw error;
    }
  };

  const getMarkerImages = async (markerId: number): Promise<MarkerImages[]> => {
    if (!db) throw new Error('База данных не инициализирована');
    try {
      return await getMarkerImagesOp(db, markerId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка получения изображений');
      setError(error);
      throw error;
    }
  };

  const updateMarker = async (id: number, latitude: number, longitude: number): Promise<void> => {
  if (!db) throw new Error('База данных не инициализирована');
  try {
    await updateMarkerOp(db, id, latitude, longitude);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Ошибка обновления маркера');
    setError(error);
    throw error;
  }
};

const contextValue: DatabaseContextType = {
  db,
  isLoading,
  error,
  addMarker,
  deleteMarker,
  addImage,
  deleteImage,
  getMarkers,
  getMarkerImages,
  initDatabase,
  updateMarker, 
  isReady,
};

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};