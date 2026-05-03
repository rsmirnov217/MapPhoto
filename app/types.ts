import * as SQLite from 'expo-sqlite';

export interface Markers {
  id: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface MarkerImages{
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
}


export interface DatabaseContextType{
  db: SQLite.SQLiteDatabase | null;
  isLoading:boolean;
  isReady: boolean; // Новый флаг
  error: Error | null;

  // Операции
  addMarker: (latitude: number, longitude: number) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  addImage: (markerId: number, uri: string) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  getMarkers: () => Promise<Markers[]>;
  getMarkerImages: (markerId: number) => Promise<MarkerImages[]>;
  initDatabase: () => Promise<void>;
  updateMarker: (id: number, latitude: number, longitude: number) => Promise<void>;
}