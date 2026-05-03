import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { globalStore } from '../_layout';
import { useDatabase } from '../contexts/DatabaseContext';

interface MarkerType {
  id: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  imageUri?: string;
}

export default function App() {
  const [markers, setMarkers] = useState<MarkerType[]>(globalStore.markers);

  const { addMarker, deleteMarker, getMarkers, addImage, getMarkerImages, isLoading, isReady } = useDatabase();

  useEffect(() => {
      if (isReady && !isLoading) {
      loadMarkersFromDatabase();
    }
  }, [isReady, isLoading]);

  const loadMarkersFromDatabase = async () => {
    try {
      const dbMarkers = await getMarkers();
      console.log('Загружено маркеров из БД:', dbMarkers.length);
      const convertedMarkers: MarkerType[] = await Promise.all(
        dbMarkers.map(async (dbMarker) => {
          const images = await getMarkerImages(dbMarker.id);
          return {
            id: dbMarker.id,
            coordinate: {
              latitude: dbMarker.latitude,
              longitude: dbMarker.longitude,
            },
            title: `Метка ${dbMarker.id}`,
            description: `Координаты: ${dbMarker.latitude.toFixed(4)}, ${dbMarker.longitude.toFixed(4)}`,
            imageUri: images[0]?.uri,
          };
        })
      );
      setMarkers(convertedMarkers);
      if (globalStore.setMarkers) globalStore.setMarkers(convertedMarkers);
    } catch (error) {
      console.error('Ошибка загрузки маркеров:', error);
    }
  };

//Обработка нажатия на карту
  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    try {
      // Сохраняем маркер в БД
      const markerId = await addMarker(latitude, longitude);
      const newMarker: MarkerType = {
        id: markerId,
        coordinate: { latitude, longitude },
        title: `Метка ${markers.length + 1}`,
        description: `Координаты: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      };
      updateMarkers([...markers, newMarker]);
    }catch(error){
      Alert.alert('Ошибка, не удалось сохранить маркер');
    }

  };

  // Добавить функцию выбора изображения
  const pickImage = async (markerId: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      try{
        await addImage(markerId, result.assets[0].uri);
        const updatedMarkers = markers.map(markers =>
          markers.id === markerId
          ? {...markers, imageUri: result.assets[0].uri}
          : markers
        );
      updateMarkers(updatedMarkers);
      Alert.alert('Успех', 'Изображение добавлено');
      }catch(error) {
        Alert.alert('Ошибка', 'Не удалось сохранить изображение');
      }
    }
  };

//Установить новый маркер
const updateMarkers = (newMarkers: MarkerType[]) => {
  setMarkers(newMarkers);
  if (globalStore.setMarkers) globalStore.setMarkers(newMarkers);
  };
//Удалить все маркеры
const clearMarkers = async () => {
    try {
      // Удаляем все маркеры из БД
      for (const marker of markers) {
        await deleteMarker(marker.id);
      }
      updateMarkers([]);
      Alert.alert('Очищено', 'Все маркеры удалены');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось удалить маркеры');
    }
  };

  if (isLoading || !isReady) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Загрузка базы данных...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={{
          latitude: 58.0139,
          longitude: 56.2211,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor="red"
            draggable
            onPress={() => pickImage(marker.id)}
            onDragEnd={ async (e) => {
              try {
                await addMarker(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
                await deleteMarker(marker.id);
                
                const updatedMarkers = markers.map(m => {
                  if (m.id === marker.id) {
                    return {
                      ...m,
                      coordinate: e.nativeEvent.coordinate,
                      description: `Координаты: ${e.nativeEvent.coordinate.latitude.toFixed(4)}, ${e.nativeEvent.coordinate.longitude.toFixed(4)}`,
                    };
                  }
                  return m;
                });
                updateMarkers(updatedMarkers);
              } catch (error) {
                Alert.alert('Ошибка', 'Не удалось обновить координаты');
              }
            }}
          />
        ))}
      </MapView>
      
      <TouchableOpacity style={styles.clearButton} onPress={clearMarkers}>
        <Text style={styles.clearButtonText}>Удалить все маркеры</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
    clearButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
