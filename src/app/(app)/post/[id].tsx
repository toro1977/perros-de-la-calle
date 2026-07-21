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
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { Skeleton } from '@/components/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ZoomableImage } from '@/components/zoomable-image';
import { DOG_POST_TYPE_META } from '@/constants/dog-post-types';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';
import { DogPostDetail, useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';
import { formatEventDate } from '@/utils/format-date';
import { normalizeArPhone } from '@/utils/phone';
import { buildWhatsAppUrl } from '@/utils/whatsapp';

// Public landing (src/app/p/[id].tsx), deployed via EAS Hosting — opens
// for anyone, app installed or not. Update this if the site ever moves
// to a custom domain.
const PUBLIC_SITE_URL = 'https://perros-de-la-calle.expo.app';

function buildShareMessage(post: DogPostDetail) {
  const typeLabel = DOG_POST_TYPE_META[post.type as DogPostType].label;
  const breedPart = post.breed ? ` · ${post.breed}` : '';
  const link = `${PUBLIC_SITE_URL}/p/${post.id}`;
  return `${typeLabel} en ${post.zone_text}${breedPart}. Mirá el aviso en Perros de la calle: ${link}`;
}

export default function PostDetailScreen() {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore(s => s.profile);
  const getPost = useDogPostsStore(s => s.getPost);
  const resolvePost = useDogPostsStore(s => s.resolvePost);
  const [post, setPost] = useState<DogPostDetail | null>(null);
  const [isResolving, setIsResolving] = useState(false);
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
    if (id) getPost(id).then(setPost);
  }, [id]);

  async function handleResolve() {
    if (!post) return;
    setIsResolving(true);
    try {
      await resolvePost(post.id);
      router.back();
    } finally {
      setIsResolving(false);
    }
  }

  async function handleShare() {
    if (!post) return;
    await Share.share({ message: buildShareMessage(post) });
  }

  function handleOpenMaps() {
    if (!post) return;
    const label = encodeURIComponent(post.zone_text);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${post.lat},${post.lng}`,
      android: `geo:0,0?q=${post.lat},${post.lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${post.lat},${post.lng}`,
    });
    Linking.openURL(url);
  }

  async function handleContact() {
    if (!post) return;
    const normalizedPhone = post.contact_phone ? normalizeArPhone(post.contact_phone) : null;
    if (!normalizedPhone) {
      setContactError('Quien publicó este aviso no dejó un teléfono de contacto válido.');
      return;
    }
    setContactError(null);
    await Linking.openURL(buildWhatsAppUrl(normalizedPhone, post.zone_text));
  }

  if (!post) {
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

  const isOwner = profile?.id === post.user_id;
  const showResolveAction = isOwner && post.status === 'active';
  const showContactAction = !isOwner && post.status === 'active';

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
            {post.photo_urls.map((url, index) => (
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
            <ThemedView style={styles.photoOverlayActions}>
              {isOwner && (
                <Pressable
                  style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                  onPress={() => router.push({ pathname: '/new-post', params: { id: post.id } })}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Editar aviso"
                >
                  <Ionicons name="pencil-outline" size={20} color="#fff" />
                </Pressable>
              )}
              <Pressable
                style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                onPress={handleShare}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Compartir aviso"
              >
                <Ionicons name="share-outline" size={20} color="#fff" />
              </Pressable>
            </ThemedView>
          </SafeAreaView>
          <ThemedView style={styles.photoFooter}>
            {post.photo_urls.length > 1 && (
              <ThemedView style={styles.dotsRow}>
                {post.photo_urls.map((url, i) => (
                  <ThemedView key={url} style={[styles.dot, i === activeIndex && styles.dotActive]} />
                ))}
              </ThemedView>
            )}
            <StatusBadge meta={DOG_POST_TYPE_META[post.type as DogPostType]} variant="solid" />
            <ThemedText type="title" style={styles.zoneOnPhoto}>
              {post.zone_text}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.body}>
          <ThemedView style={styles.infoList}>
            <ThemedView style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="default">{formatEventDate(post.event_date)}</ThemedText>
            </ThemedView>
            {post.breed && (
              <ThemedView style={styles.infoRow}>
                <Ionicons name="paw-outline" size={18} color={theme.textSecondary} />
                <ThemedText type="default">{post.breed}</ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.mapCard}>
            <MapView
              style={styles.map}
              initialRegion={{ latitude: post.lat, longitude: post.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker coordinate={{ latitude: post.lat, longitude: post.lng }} pinColor={theme[DOG_POST_TYPE_META[post.type as DogPostType].tone]} />
            </MapView>
            <Pressable
              style={[styles.mapOpenButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleOpenMaps}
              accessibilityRole="button"
              accessibilityLabel="Abrir en Maps"
            >
              <Ionicons name="navigate-outline" size={16} color={theme.text} />
              <ThemedText type="small" style={{ fontWeight: '600' }}>
                Abrir en Maps
              </ThemedText>
            </Pressable>
          </ThemedView>

          {post.description && (
            <ThemedView style={[styles.descriptionBox, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="default">{post.description}</ThemedText>
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

      {(showResolveAction || showContactAction) && (
        <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          {showResolveAction && (
            <Button
              label={isResolving ? 'Actualizando...' : 'Marcar como resuelto'}
              onPress={handleResolve}
              loading={isResolving}
              icon={<Ionicons name="checkmark-circle-outline" size={18} color={theme.onAccent} />}
            />
          )}
          {showContactAction && (
            <Button
              label="Vi a este perro"
              variant="danger"
              onPress={handleContact}
              icon={<Ionicons name="logo-whatsapp" size={18} color={theme.onAccent} />}
            />
          )}
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
                {post.photo_urls.map(url => (
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
              {post.photo_urls.length > 1 && (
                <SafeAreaView edges={['bottom']} style={styles.fullscreenBottom}>
                  <ThemedView style={styles.dotsRow}>
                    {post.photo_urls.map((url, i) => (
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  photoOverlayActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: 'transparent',
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
  mapCard: {
    height: 180,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapOpenButton: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
