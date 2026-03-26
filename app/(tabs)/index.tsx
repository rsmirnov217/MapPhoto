import React, {useState} from 'react';
import MapView, {Marker} from 'react-native-maps';
import {View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';

interface MarkerType {
  id: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
}

export default function App() {
  const [markers, setMarkers] = useState<MarkerType[]>([]);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newMarker: MarkerType = {
      id: Date.now(),
      coordinate: { latitude, longitude },
      title: `Метка ${markers.length + 1}`,
      description: `Координаты: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
    setMarkers([...markers, newMarker]);
  };

  const clearMarkers = () => {
    setMarkers([]);
    Alert.alert('Очищено', 'Все маркеры удалены');
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
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
              setMarkers(updatedMarkers);
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
