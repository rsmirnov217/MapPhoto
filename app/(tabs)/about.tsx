import { Text, View, StyleSheet, FlatList, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { globalStore } from '../_layout';

export default function AboutScreen() {
  const [markers, setMarkers] = useState(globalStore.markers);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarkers(globalStore.markers);
    }, 100);
    return () => clearInterval(interval);
  }, []);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Список маркеров с фото</Text>
      <FlatList
        data={markers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.markerItem}>
            <Text style={styles.markerTitle}>{item.title}</Text>
            <Text style={styles.markerDesc}>{item.description}</Text>
            {item.imageUri && (
              <Image source={{ uri: item.imageUri }} style={styles.image} />
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  markerItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  markerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  markerDesc: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
});