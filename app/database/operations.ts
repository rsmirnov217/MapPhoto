import * as SQLite from 'expo-sqlite';
import { MarkerImages, Markers } from '../types';

export const addMarker = (
  db: SQLite.SQLiteDatabase, 
  latitude: number, 
  longitude: number
): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.runSync(
        'INSERT INTO markers (latitude, longitude) VALUES (?, ?);',
        [latitude, longitude]
      );
      resolve(result.lastInsertRowId);
    } catch (error) {
      reject(error);
    }
  });
};

export const deleteMarker = (
  db: SQLite.SQLiteDatabase, 
  id: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync('DELETE FROM markers WHERE id = ?;', [id]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const getMarkers = (
  db: SQLite.SQLiteDatabase
): Promise<Markers[]> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync<Markers>(
        'SELECT * FROM markers ORDER BY created_at DESC;'
      );
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

export const addImage = (
  db: SQLite.SQLiteDatabase,
  markerId: number,
  uri: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync(
        'INSERT INTO marker_images (marker_id, uri) VALUES (?, ?);',
        [markerId, uri]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const deleteImage = (
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync('DELETE FROM marker_images WHERE id = ?;', [id]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const getMarkerImages = (
  db: SQLite.SQLiteDatabase,
  markerId: number
): Promise<MarkerImages[]> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync<MarkerImages>(
        'SELECT * FROM marker_images WHERE marker_id = ? ORDER BY created_at DESC;',
        [markerId]
      );
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

export const updateMarker = (
  db: SQLite.SQLiteDatabase,
  id: number,
  latitude: number,
  longitude: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.runSync(
        'UPDATE markers SET latitude = ?, longitude = ? WHERE id = ?;',
        [latitude, longitude, id]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
