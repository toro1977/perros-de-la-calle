import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { Skeleton } from '@/components/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ZoomableImage } from '@/components/zoomable-image';
import { ADOPTION_STATUS_META } from '@/constants/adoption-status';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AdoptionDogDetail, useAdoptionDogsStore } from '@/stores/adoptionDogsStore';
import { useAuthStore } from '@/stores/authStore';
import { AdoptionDogStatus } from '@/types/database.types';
import { normalizeArPhone } from '@/utils/phone';

function buildWhatsAppUrl(e164Phone: string, dogName: string | null) {
  const digits = e164Phone.replace(/\D/g, '');
  const message = dogName
    ? `Hola! Vi a ${dogName} en adopción en la app Perros de la calle.`
    : 'Hola! Vi un perro en adopción en la app Perros de la calle.';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function AdoptionDogDetailScreen() {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore(s => s.profile);
  const getAdoptionDog = useAdoptionDogsStore(s => s.getAdoptionDog);
  const [dog, setDog] = useState<AdoptionDogDetail | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [pagerScrollEnabled, setPagerScrollEnabled] = useState(true);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<Set<string>>(new Set());

  function handlePhotoScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth));
  }

  function handleFullscreenScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActiveIndex(index);
    setFullscreenIndex(index);
  }

  useEffect(() => {
    if (id) getAdoptionDog(id).then(setDog);
  }, [id]);

  async function handleContact() {
    if (!dog) return;
    const normalizedPhone = dog.contact_phone ? normalizeArPhone(dog.contact_phone) : null;
    if (!normalizedPhone) {
      setContactError('El refugio no dejó un teléfono de contacto válido.');
      return;
    }
    setContactError(null);
    await Linking.openURL(buildWhatsAppUrl(normalizedPhone, dog.name));
  }

  if (!dog) {
    return (
      <ThemedView style={styles.container}>
        <Skeleton style={styles.photoWrap} />
        <ThemedView style={styles.body}>
          <Skeleton style={styles.skeletonBadge} />
          <Skeleton style={styles.skeletonTitle} />
          <Skeleton style={styles.skeletonLine} />
          <Skeleton style={[styles.skeletonLine, styles.skeletonLineNarrow]} />
        </ThemedView>
      </ThemedView>
    );
  }

  const isOwner = profile?.id === dog.shelter_id;
  const showContactAction = !isOwner && dog.status === 'available';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.photoWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePhotoScrollEnd}
            style={styles.photo}
          >
            {dog.photo_urls.map((url, index) => (
              <Pressable
                key={url}
                onPress={() => {
                  setPagerScrollEnabled(true);
                  setFullscreenIndex(index);
                }}
                style={{ width: screenWidth, height: '100%' }}
              >
                {failedPhotoUrls.has(url) ? (
                  <ThemedView style={[styles.photoFallback, { backgroundColor: theme.backgroundElement }]}>
                    <Ionicons name="paw" size={40} color={theme.textSecondary} />
                  </ThemedView>
                ) : (
                  <Image
                    source={{ uri: url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    onError={() => setFailedPhotoUrls(prev => new Set(prev).add(url))}
                  />
                )}
              </Pressable>
            ))}
          </ScrollView>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={styles.photoGradient} />
          <SafeAreaView edges={['top']} style={styles.photoOverlay}>
            <Pressable
              style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            {isOwner && (
              <Pressable
                style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                onPress={() => router.push('/my-posts')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Gestionar en Mis avisos"
              >
                <Ionicons name="settings-outline" size={20} color="#fff" />
              </Pressable>
            )}
          </SafeAreaView>
          <ThemedView style={styles.photoFooter}>
            {dog.photo_urls.length > 1 && (
              <ThemedView style={styles.dotsRow}>
                {dog.photo_urls.map((url, i) => (
                  <ThemedView key={url} style={[styles.dot, i === activeIndex && styles.dotActive]} />
                ))}
              </ThemedView>
            )}
            <StatusBadge meta={ADOPTION_STATUS_META[dog.status as AdoptionDogStatus]} variant="solid" />
            <ThemedText type="title" style={styles.zoneOnPhoto}>
              {dog.name || 'Perro en adopción'}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.body}>
          <ThemedView style={styles.infoList}>
            <ThemedView style={styles.infoRow}>
              <Ionicons name="home-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="default">{dog.shelter_name}</ThemedText>
            </ThemedView>
            {dog.breed && (
              <ThemedView style={styles.infoRow}>
                <Ionicons name="paw-outline" size={18} color={theme.textSecondary} />
                <ThemedText type="default">{dog.breed}</ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {dog.description && (
            <ThemedView style={[styles.descriptionBox, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="default">{dog.description}</ThemedText>
            </ThemedView>
          )}

          {contactError && (
            <ThemedView style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
              <Ionicons name="alert-circle" size={16} color={theme.danger} />
              <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                {contactError}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>

      {showContactAction && (
        <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button
            label="Quiero adoptarlo"
            variant="danger"
            onPress={handleContact}
            icon={<Ionicons name="logo-whatsapp" size={18} color={theme.onAccent} />}
          />
        </SafeAreaView>
      )}

      {fullscreenIndex !== null && (
        <Modal visible animationType="fade" onRequestClose={() => setFullscreenIndex(null)}>
          {/* RN's Modal presents in its own native root on iOS — the
              outer app's SafeAreaProvider doesn't reach in, so insets
              read as 0 without a fresh provider mounted inside here. */}
          <SafeAreaProvider>
            <ThemedView style={styles.fullscreenContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                scrollEnabled={pagerScrollEnabled}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleFullscreenScrollEnd}
                contentOffset={{ x: fullscreenIndex * screenWidth, y: 0 }}
                style={styles.fullscreenScroll}
              >
                {dog.photo_urls.map(url => (
                  <ZoomableImage
                    key={url}
                    uri={url}
                    width={screenWidth}
                    height={screenHeight}
                    onZoomChange={zoomed => setPagerScrollEnabled(!zoomed)}
                  />
                ))}
              </ScrollView>
              <SafeAreaView edges={['top']} style={styles.fullscreenTop}>
                <Pressable
                  style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                  onPress={() => setFullscreenIndex(null)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable>
              </SafeAreaView>
              {dog.photo_urls.length > 1 && (
                <SafeAreaView edges={['bottom']} style={styles.fullscreenBottom}>
                  <ThemedView style={styles.dotsRow}>
                    {dog.photo_urls.map((url, i) => (
                      <ThemedView key={url} style={[styles.dot, i === activeIndex && styles.dotActive]} />
                    ))}
                  </ThemedView>
                </SafeAreaView>
              )}
            </ThemedView>
          </SafeAreaProvider>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: Spacing.six,
  },
  photoWrap: {
    width: '100%',
    height: 360,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  photoFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.four,
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  zoneOnPhoto: {
    color: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
    marginBottom: Spacing.one,
    backgroundColor: 'transparent',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  body: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  infoList: {
    gap: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  descriptionBox: {
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.sm,
  },
  skeletonBadge: {
    width: 90,
    height: 24,
    borderRadius: Radius.full,
  },
  skeletonTitle: {
    width: '70%',
    height: 30,
    borderRadius: Radius.sm,
  },
  skeletonLine: {
    height: 16,
    borderRadius: Radius.sm,
  },
  skeletonLineNarrow: {
    width: '50%',
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  // Lightbox background is always black, independent of light/dark
  // theme — photos need max contrast, not the app's surface color.
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  fullscreenScroll: {
    flex: 1,
  },
  fullscreenTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'transparent',
  },
  fullscreenBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: Spacing.three,
    backgroundColor: 'transparent',
  },
});
