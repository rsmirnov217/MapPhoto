import React, {useState} from 'react';
import MapView, {Marker} from 'react-native-maps';
import {View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {globalStore} from '../_layout';

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

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newMarker: MarkerType = {
      id: Date.now(),
      coordinate: { latitude, longitude },
      title: `Метка ${markers.length + 1}`,
      description: `Координаты: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
    updateMarkers([...markers, newMarker]);
  };

  // Добавить функцию выбора изображения
  const pickImage = async (markerId: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
    const updatedMarkers = markers.map(marker => 
      marker.id === markerId 
        ? { ...marker, imageUri: result.assets[0].uri }
        : marker

        );
      updateMarkers(updatedMarkers);
    }
  };

const updateMarkers = (newMarkers: MarkerType[]) => {
  setMarkers(newMarkers);
  if (globalStore.setMarkers) globalStore.setMarkers(newMarkers);
  };

  const clearMarkers = () => {
    updateMarkers([]);
    Alert.alert('Очищено', 'Все маркеры удалены');
  };

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
            onDragEnd={(e) => {
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
