import * as Notifications from 'expo-notifications';

// Константы
const PROXIMITY_THRESHOLD = 500; // метров

// Интерфейсы
interface Marker {
  id: number;
  latitude: number;
  longitude: number;
  name?: string;
}

// Настройка обработчика уведомлений (только для локальных)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Формула Хаверсина
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Класс для управления уведомлениями
export class ProximityNotificationService {
  private markers: Marker[] = [];
  private activeNotifications: Set<number> = new Set();

  setMarkers(markers: Marker[]) {
    console.log(`Установлено ${markers.length} маркеров`);
    this.markers = markers;
  }

  addMarker(marker: Marker) {
    console.log(`Добавлен маркер ${marker.id}`);
    this.markers.push(marker);
  }

  removeMarker(markerId: number) {
    console.log(`Удален маркер ${markerId}`);
    this.markers = this.markers.filter(m => m.id !== markerId);
    this.activeNotifications.delete(markerId);
  }

  // Проверка приближения
  checkProximity(latitude: number, longitude: number) {
    this.markers.forEach(marker => {
      const distance = calculateDistance(
        latitude,
        longitude,
        marker.latitude,
        marker.longitude
      );

      console.log(`Маркер ${marker.id}: расстояние ${distance.toFixed(0)}м`);

      if (distance <= PROXIMITY_THRESHOLD && !this.activeNotifications.has(marker.id)) {
        console.log(`ОТПРАВКА уведомления для маркера ${marker.id}`);
        
        // Локальное уведомление
        Notifications.scheduleNotificationAsync({
          content: {
            title: "Вы рядом с меткой!",
            body: marker.name 
              ? `Вы рядом с "${marker.name}" (${distance.toFixed(0)}м)`
              : `Вы рядом с точкой (${distance.toFixed(0)}м)`,
          },
          trigger: null,
        });
        
        this.activeNotifications.add(marker.id);
      } else if (distance > PROXIMITY_THRESHOLD && this.activeNotifications.has(marker.id)) {
        console.log(`Маркер ${marker.id} вышел из зоны`);
        this.activeNotifications.delete(marker.id);
      }
    });
  }

  stopTracking() {
    this.activeNotifications.clear();
  }
}

// Создаем экземпляр
export const proximityService = new ProximityNotificationService();