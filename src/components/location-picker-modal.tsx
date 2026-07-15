import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CurrentLocation, reverseGeocode } from '@/services/location';

// Buenos Aires — used only if we have no GPS fix at all to seed the map.
const FALLBACK_REGION: Region = { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.5, longitudeDelta: 0.5 };

// Below this, a pin nudge isn't worth a new geocode call — avoids firing
// on every tiny finger adjustment while someone's still fine-tuning the
// pin position over the same spot.
const MIN_REGEOCODE_METERS = 60;

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type Props = {
  visible: boolean;
  initialLocation: CurrentLocation | null;
  onConfirm: (location: CurrentLocation) => void;
  onClose: () => void;
};

export function LocationPickerModal({ visible, initialLocation, onConfirm, onClose }: Props) {
  const theme = useTheme();
  const [region, setRegion] = useState<Region | null>(null);
  const [zoneText, setZoneText] = useState(initialLocation?.zoneText ?? '');
  const [isResolving, setIsResolving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGeocodedRef = useRef<{ latitude: number; longitude: number } | null>(
    initialLocation ? { latitude: initialLocation.lat, longitude: initialLocation.lng } : null
  );
  // Bumped on every debounced geocode call — a response only gets applied
  // if it's still the most recent one requested, so a slow, stale request
  // can't overwrite a faster, more recent result that already landed.
  const requestIdRef = useRef(0);

  const startRegion: Region = initialLocation
    ? { latitude: initialLocation.lat, longitude: initialLocation.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : FALLBACK_REGION;

  function handleRegionChangeComplete(nextRegion: Region) {
    setRegion(nextRegion);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const last = lastGeocodedRef.current;
    if (last && distanceMeters(last, nextRegion) < MIN_REGEOCODE_METERS) return;

    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setIsResolving(true);
      try {
        const text = await reverseGeocode(nextRegion.latitude, nextRegion.longitude);
        if (requestId !== requestIdRef.current) return; // a newer request already landed
        lastGeocodedRef.current = { latitude: nextRegion.latitude, longitude: nextRegion.longitude };
        setZoneText(text);
      } catch {
        // best-effort — keep whatever zone text we already had
      } finally {
        if (requestId === requestIdRef.current) setIsResolving(false);
      }
    }, 500);
  }

  function handleConfirm() {
    const final = region ?? startRegion;
    onConfirm({ lat: final.latitude, lng: final.longitude, zoneText: zoneText || 'Ubicación sin identificar' });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* RN's Modal presents in its own native root on iOS — the outer
          app's SafeAreaProvider doesn't reach in, so insets read as 0
          without a fresh provider mounted inside the modal itself. */}
      <SafeAreaProvider>
        <ThemedView style={styles.container}>
          <MapView style={styles.map} initialRegion={startRegion} onRegionChangeComplete={handleRegionChangeComplete} />

          <ThemedView style={styles.pinWrap} pointerEvents="none">
            <Ionicons name="location" size={40} color={theme.danger} />
          </ThemedView>

          <SafeAreaView edges={['top']} style={styles.topBar}>
            <Pressable
              style={[styles.closeButton, { backgroundColor: theme.surface }]}
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </SafeAreaView>

          <SafeAreaView
            edges={['bottom']}
            style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}
          >
            <ThemedView style={styles.zoneRow}>
              <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
              {isResolving ? (
                <ActivityIndicator size="small" color={theme.textSecondary} />
              ) : (
                <ThemedText type="default" numberOfLines={1} style={styles.zoneText}>
                  {zoneText || 'Movés el mapa para ubicar la zona'}
                </ThemedText>
              )}
            </ThemedView>
            <Button label="Confirmar ubicación" onPress={handleConfirm} disabled={isResolving} />
          </SafeAreaView>
        </ThemedView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  pinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    backgroundColor: 'transparent',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'transparent',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  bottomBar: {
    borderTopWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  zoneText: {
    flex: 1,
  },
});
