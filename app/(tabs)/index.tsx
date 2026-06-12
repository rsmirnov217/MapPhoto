import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { globalStore } from '../_layout';
import { useDatabase } from '../contexts/DatabaseContext';
import { proximityService } from '../notifications';

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

interface LocationState {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  isTracking: boolean;
}

export default function App() {
  const [markers, setMarkers] = useState<MarkerType[]>(globalStore.markers);

  const [locationState, setLocationState] = useState<LocationState>({
    location: null,
    errorMsg: null,
    isTracking: false,
  });
  const [region, setRegion] = useState<Region>({
    latitude: 58.0139,
    longitude: 56.2211,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView>(null);

  const { addMarker, deleteMarker, getMarkers, addImage, getMarkerImages, isLoading, isReady, deleteImage } = useDatabase();

  useEffect(() => {
      if (isReady && !isLoading) {
      loadMarkersFromDatabase();
      requestLocationPermissionsAndStartTracking()
    }
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      proximityService.stopTracking();
    };
  }, [isReady, isLoading]);

  useEffect(() => {
    console.log('Маркеры в state изменились:', markers.length);
    if (markers.length > 0) {
      const notificationMarkers = markers.map(m => ({
        id: m.id,
        latitude: m.coordinate.latitude,
        longitude: m.coordinate.longitude,
        name: m.title
      }));
      console.log('Отправляем в notificationService:', notificationMarkers);
      proximityService.setMarkers(notificationMarkers);
    }
  }, [markers]);

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

    // Запрос разрешений на местоположение
  const requestLocationPermissionsAndStartTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationState(prev => ({
          ...prev,
          errorMsg: 'Доступ к местоположению не разрешён. Некоторые функции могут быть недоступны.'
        }));
        return;
      }
      
      // Получаем текущее местоположение
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocationState(prev => ({
        ...prev,
        location: currentLocation,
        errorMsg: null,
      }));
      
      // Центрируем карту на текущем местоположении
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      // Запускаем отслеживание в реальном времени
      await startLocationUpdates();
      //await proximityService.startTracking();
      
    } catch (error) {
      console.error('Ошибка получения местоположения:', error);
      setLocationState(prev => ({
        ...prev,
        errorMsg: 'Не удалось получить ваше местоположение. Проверьте настройки GPS.'
      }));
    }
  };

    // Запуск отслеживания местоположения
  const startLocationUpdates = async () => {
    try {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,      // Обновление каждые 5 секунд
          distanceInterval: 5,     // Или при перемещении на 5 метров
        },
        (newLocation) => {
          setLocationState(prev => ({
            ...prev,
            location: newLocation,
            isTracking: true,
          }));
              // Проверяем уведомления
          proximityService.checkProximity(
            newLocation.coords.latitude,
            newLocation.coords.longitude
          );
          console.log('Новые координаты:', newLocation.coords.latitude, newLocation.coords.longitude);
        }
      );
      
      setLocationState(prev => ({
        ...prev,
        isTracking: true,
        errorMsg: null,
      }));
      
    } catch (error) {
      console.error('Ошибка запуска отслеживания:', error);
      setLocationState(prev => ({
        ...prev,
        errorMsg: 'Не удалось запустить отслеживание местоположения',
        isTracking: false,
      }));
    }
  };

    // Центрирование карты на текущем местоположении
  const centerOnUserLocation = () => {
    if (locationState.location) {
      const newRegion = {
        latitude: locationState.location.coords.latitude,
        longitude: locationState.location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } else {
      Alert.alert('Ошибка', 'Ваше местоположение недоступно');
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
      proximityService.addMarker({ // ДОБАВИТЬ ЭТОТ БЛОК
        id: markerId,
        latitude: latitude,
        longitude: longitude,
        name: `Метка ${markers.length + 1}`
      });
    }catch(error){
      Alert.alert('Ошибка, не удалось сохранить маркер');
    }

  };

  const deleteImageFromMarker = async (markerId: number) => {
    try {
      const images = await getMarkerImages(markerId);
      if (images.length === 0) {
        Alert.alert('Информация', 'У этого маркера нет изображений');
        return;
      }
      
      await deleteImage(images[0].id);
      
      const updatedMarkers = markers.map(marker =>
        marker.id === markerId
          ? { ...marker, imageUri: undefined }
          : marker
      );
      updateMarkers(updatedMarkers);
      Alert.alert('Успех', 'Изображение удалено');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось удалить изображение');
      console.error(error);
    }
  };

  const deleteSingleMarker = async (markerId: number) => {
  Alert.alert(
    'Подтверждение удаления',
    'Вы уверены, что хотите удалить этот маркер? Это действие нельзя отменить.',
    [
      {
        text: 'Да, удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMarker(markerId);
            proximityService.removeMarker(markerId);
            const updatedMarkers = markers.filter(m => m.id !== markerId);
            updateMarkers(updatedMarkers);
            Alert.alert('Успех', 'Маркер удален');
          } catch (error) {
            Alert.alert('Ошибка', 'Не удалось удалить маркер');
            console.error(error);
          }
        }
      },
      {
        text: 'Отмена',
        style: 'cancel'
      }
    ]
  );
};

const handleMarkerPress = async (markerId: number) => {
  const marker = markers.find(m => m.id === markerId);
  
  if (marker?.imageUri) {
    // Есть изображение
    Alert.alert(
      'Действия с маркером',
      `Маркер ${marker?.id}\n${marker?.description}`,
      [
        {
          text: 'Удалить маркер',
          style: 'destructive' as const,
          onPress: () => deleteSingleMarker(markerId)
        },
        {
          text: 'Удалить изображение',
          style: 'destructive' as const,
          onPress: () => deleteImageFromMarker(markerId)
        },
        {
          text: 'Изменить изображение',
          onPress: () => pickImage(markerId)
        },
        {
          text: 'Отмена',
          style: 'cancel' as const
        }
      ]
    );
  } else {
    // Нет изображения
    Alert.alert(
      'Действия с маркером',
      `Маркер ${marker?.id}\n${marker?.description}`,
      [
        {
          text: 'Удалить маркер',
          style: 'destructive' as const,
          onPress: () => deleteSingleMarker(markerId)
        },
        {
          text: 'Добавить изображение',
          onPress: () => pickImage(markerId)
        },
        {
          text: 'Отмена',
          style: 'cancel' as const
        }
      ]
    );
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
    try {
      // Сначала удаляем старое изображение, если есть
      const images = await getMarkerImages(markerId);
      if (images.length > 0) {
        await deleteImage(images[0].id);
      }
      
      // Добавляем новое изображение
      await addImage(markerId, result.assets[0].uri);
      const updatedMarkers = markers.map(marker =>
        marker.id === markerId
          ? { ...marker, imageUri: result.assets[0].uri }
          : marker
      );
      updateMarkers(updatedMarkers);
      Alert.alert('Успех', 'Изображение обновлено');
    } catch(error) {
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
        ref={mapRef}
        style={styles.map} 
        region={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor="red"
            draggable
            onPress={() => handleMarkerPress(marker.id)}
            onDragEnd={ async (e) => {
              e.persist();
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

      <TouchableOpacity style={styles.locationButton} onPress={centerOnUserLocation}>
        <Text style={styles.locationButtonText}>📍</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.clearButton} onPress={clearMarkers}>
        <Text style={styles.clearButtonText}>Удалить все маркеры</Text>
      </TouchableOpacity>

      {/* Индикатор статуса GPS */}
      {locationState.isTracking && locationState.location && (
        <View style={styles.gpsStatus}>
          <Text style={styles.gpsStatusText}>
            GPS активен
          </Text>
        </View>
      )}

      {locationState.errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{locationState.errorMsg}</Text>
        </View>
      )}
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
  locationButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
    locationButtonText: {
    fontSize: 24,
  },
  gpsStatus: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gpsStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,0,0,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center'
  }
});
