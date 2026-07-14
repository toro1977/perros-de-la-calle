import { Alert } from 'react-native';
import * as Location from 'expo-location';

export type CurrentLocation = {
  lat: number;
  lng: number;
  zoneText: string;
};

// Builds a short human-readable area label (e.g. "Quilmes, Buenos Aires")
// from reverse geocoding, without needing a map — good enough for a list.
function buildZoneText(place: Location.LocationGeocodedAddress | undefined) {
  if (!place) return 'Ubicación sin identificar';
  return [place.city ?? place.subregion, place.region].filter(Boolean).join(', ') || 'Ubicación sin identificar';
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
  return buildZoneText(place);
}

export async function getCurrentLocation(): Promise<CurrentLocation | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    Alert.alert('Permiso requerido', 'Necesitamos tu ubicación para esto.');
    return null;
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const [place] = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    zoneText: buildZoneText(place),
  };
}
