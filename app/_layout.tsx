import { Stack } from 'expo-router';
import { useState } from 'react';
import { DatabaseProvider } from './contexts/DatabaseContext';

export const globalStore = {
  markers: [] as any[],
  setMarkers: null as any,
};

export default function RootLayout() {
  const [markers, setMarkers] = useState([]);
  globalStore.markers = markers;
  globalStore.setMarkers = setMarkers;
  return (
    <DatabaseProvider>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
    </DatabaseProvider>
  );
}
