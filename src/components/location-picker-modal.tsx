import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CurrentLocation, reverseGeocode } from '@/services/location';

// Buenos Aires — used only if we have no GPS fix at all to seed the map.
const FALLBACK_REGION: Region = { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.5, longitudeDelta: 0.5 };

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

  const startRegion: Region = initialLocation
    ? { latitude: initialLocation.lat, longitude: initialLocation.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : FALLBACK_REGION;

  function handleRegionChangeComplete(nextRegion: Region) {
    setRegion(nextRegion);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsResolving(true);
      try {
        const text = await reverseGeocode(nextRegion.latitude, nextRegion.longitude);
        setZoneText(text);
      } catch {
        // best-effort — keep whatever zone text we already had
      } finally {
        setIsResolving(false);
      }
    }, 500);
  }

  function handleConfirm() {
    const final = region ?? startRegion;
    onConfirm({ lat: final.latitude, lng: final.longitude, zoneText: zoneText || 'Ubicación sin identificar' });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <MapView style={styles.map} initialRegion={startRegion} onRegionChangeComplete={handleRegionChangeComplete} />

        <ThemedView style={styles.pinWrap} pointerEvents="none">
          <Ionicons name="location" size={40} color={theme.danger} />
        </ThemedView>

        <SafeAreaView edges={['top']} style={styles.topBar}>
          <Pressable style={[styles.closeButton, { backgroundColor: theme.surface }]} onPress={onClose} hitSlop={8}>
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
