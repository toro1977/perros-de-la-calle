import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/services/supabase';

export type CurrentLocation = {
  lat: number;
  lng: number;
  zoneText: string;
};

// Builds a short human-readable area label (e.g. "Quilmes") from reverse
// geocoding. Just the most granular component — a card title that's the
// same "Provincia de Buenos Aires" on every post doesn't help anyone
// tell posts apart, so province/country never make it into this label.
function buildZoneText(place: Location.LocationGeocodedAddress | undefined) {
  if (!place) return 'Ubicación sin identificar';
  return place.district ?? place.city ?? place.subregion ?? 'Ubicación sin identificar';
}

// The reverse-geocode Edge Function proxies Nominatim (OpenStreetMap)
// server-side — calling Nominatim directly from the device silently
// dropped the custom User-Agent header (fetch() treats it as a
// "forbidden" header on some RN environments), which meant every call
// was falling back to Apple's geocoder and never actually showing the
// richer "Localidad, Partido, Provincia" text at all. Native geocoding
// here is now only the fallback for when the Edge Function itself is
// unreachable (offline, Supabase down), not the primary source.
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke<{ zoneText: string | null }>('reverse-geocode', {
      body: { lat, lng },
    });
    if (!error && data?.zoneText) return data.zoneText;
  } catch {
    // fall through to native geocoding below
  }
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
  const zoneText = await reverseGeocode(position.coords.latitude, position.coords.longitude);

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    zoneText,
  };
}
