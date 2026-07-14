import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { Skeleton } from '@/components/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';
import { DogPostDetail, useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';
import { formatEventDate } from '@/utils/format-date';
import { normalizeArPhone } from '@/utils/phone';

function buildWhatsAppUrl(e164Phone: string, zoneText: string) {
  const digits = e164Phone.replace(/\D/g, '');
  const message = `Hola! Vi tu aviso de un perro en ${zoneText} en la app Perros de la calle.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function PostDetailScreen() {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore(s => s.profile);
  const getPost = useDogPostsStore(s => s.getPost);
  const resolvePost = useDogPostsStore(s => s.resolvePost);
  const [post, setPost] = useState<DogPostDetail | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function handlePhotoScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth));
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
            {post.photo_urls.map(url => (
              <Image key={url} source={{ uri: url }} style={{ width: screenWidth, height: '100%' }} contentFit="cover" />
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
          </SafeAreaView>
          <ThemedView style={styles.photoFooter}>
            {post.photo_urls.length > 1 && (
              <ThemedView style={styles.dotsRow}>
                {post.photo_urls.map((url, i) => (
                  <ThemedView key={url} style={[styles.dot, i === activeIndex && styles.dotActive]} />
                ))}
              </ThemedView>
            )}
            <StatusBadge type={post.type as DogPostType} variant="solid" />
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
    paddingHorizontal: Spacing.three,
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
});
