import { Alert } from 'react-native';
import * as Location from 'expo-location';

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

type NominatimAddress = {
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state_district?: string;
  state?: string;
};

// Apple's on-device geocoder (Location.reverseGeocodeAsync) only knows
// the partido level in Greater Buenos Aires ("Esteban Echeverría" for
// every coordinate from Monte Grande to Luis Guillón) — not useful for
// telling posts in the same partido apart. Nominatim's data for
// Argentina goes down to the actual barrio/localidad, which is what
// people search a lost dog by. Native geocoding is the fallback if this
// fails (offline, rate-limited, etc.) rather than the primary source.
async function reverseGeocodeNominatim(lat: number, lng: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=es&zoom=14`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PerrosDeLaCalleApp/1.0 (contacto@perrosdelacalle.app)' },
  });
  if (!response.ok) return null;
  const data: { address?: NominatimAddress } = await response.json();
  const address = data.address;
  if (!address) return null;
  return (
    address.suburb ??
    address.neighbourhood ??
    address.quarter ??
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.state_district ??
    address.state ??
    null
  );
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const zone = await reverseGeocodeNominatim(lat, lng);
    if (zone) return zone;
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
