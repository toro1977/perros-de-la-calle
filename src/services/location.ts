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

function stripPartidoPrefix(name: string) {
  return name.replace(/^Partido de\s+/i, '');
}

function shortenProvince(name: string) {
  return name === 'Ciudad Autónoma de Buenos Aires' ? 'CABA' : name;
}

// Apple's on-device geocoder (Location.reverseGeocodeAsync) only knows
// the partido level in Greater Buenos Aires ("Esteban Echeverría" for
// every coordinate from Monte Grande to Luis Guillón) — not useful for
// telling posts in the same partido apart. Nominatim's data for
// Argentina goes down to the actual barrio/localidad, which is what
// people search a lost dog by. Native geocoding is the fallback if this
// fails (offline, rate-limited, etc.) rather than the primary source.
//
// Builds "Localidad, Partido, Provincia" — CABA's state_district comes
// back as "Comuna 14", which nobody navigates by, so that segment is
// dropped there and it's just "Barrio, CABA" instead.
async function reverseGeocodeNominatim(lat: number, lng: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=es&zoom=14`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PerrosDeLaCalleApp/1.0 (contacto@perrosdelacalle.app)' },
  });
  if (!response.ok) return null;
  const data: { address?: NominatimAddress } = await response.json();
  const address = data.address;
  if (!address) return null;

  // suburb (barrio) wins when present — that's how CABA's own city
  // ("Buenos Aires" for every coordinate in it) gets skipped in favor of
  // e.g. "Palermo". Otherwise the actual locality name (city/town/
  // village) beats neighbourhood/quarter, which tend to be finer-grained
  // than what's useful for "which town is this dog in" (e.g. "Temperley"
  // over "Barrio Inglés").
  const locality =
    address.suburb ??
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.neighbourhood ??
    address.quarter ??
    null;
  const isComuna = address.state_district && /^Comuna\s+\d+/i.test(address.state_district);
  const partido = address.state_district && !isComuna ? stripPartidoPrefix(address.state_district) : null;
  const province = address.state ? shortenProvince(address.state) : null;

  const parts: string[] = [];
  for (const part of [locality, partido, province]) {
    if (part && parts[parts.length - 1] !== part) parts.push(part);
  }
  return parts.length > 0 ? parts.join(', ') : null;
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
