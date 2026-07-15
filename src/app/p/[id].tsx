import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { Skeleton } from '@/components/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DogPostDetail, useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';
import { formatEventDate } from '@/utils/format-date';
import { normalizeArPhone } from '@/utils/phone';

// Public, unauthenticated post page — the landing that a shared link
// opens for people who don't have the app installed. Lives outside
// (app)/(auth) on purpose: src/app/_layout.tsx's NavigationGuard
// special-cases the "p" segment so it never bounces to /login.
function buildWhatsAppUrl(e164Phone: string, zoneText: string) {
  const digits = e164Phone.replace(/\D/g, '');
  const message = `Hola! Vi tu aviso de un perro en ${zoneText} en la app Perros de la calle.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function PublicPostScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const getPost = useDogPostsStore(s => s.getPost);
  const [post, setPost] = useState<DogPostDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPost(id).then(result => {
      if (result) setPost(result);
      else setNotFound(true);
    });
  }, [id]);

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

  function handleOpenApp() {
    if (!id) return;
    Linking.openURL(`perrosdelacalle://post/${id}`);
  }

  if (notFound) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.empty}>
            <Ionicons name="paw-outline" size={32} color={theme.textSecondary} />
            <ThemedText type="default" style={styles.emptyTitle}>
              Este aviso ya no está disponible
            </ThemedText>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!post) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.body}>
            <Skeleton style={styles.photo} />
            <Skeleton style={styles.skeletonLine} />
            <Skeleton style={[styles.skeletonLine, styles.skeletonLineNarrow]} />
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.photoWrap}>
            <Image source={{ uri: post.photo_urls[0] }} style={styles.photo} contentFit="cover" />
          </ThemedView>

          <ThemedView style={styles.infoBlock}>
            <StatusBadge type={post.type as DogPostType} variant="solid" />
            <ThemedText type="title">{post.zone_text}</ThemedText>
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

          {post.status === 'active' && (
            <Button
              label="Vi a este perro"
              variant="danger"
              onPress={handleContact}
              icon={<Ionicons name="logo-whatsapp" size={18} color={theme.onAccent} />}
            />
          )}

          {Platform.OS === 'web' && (
            <ThemedView style={[styles.appBanner, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="small" style={{ color: theme.accent, flex: 1 }}>
                Este aviso es de Perros de la calle, la app para reportar y buscar perros perdidos.
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.accent, fontWeight: '700' }} onPress={handleOpenApp}>
                Abrir en la app
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  photoWrap: {
    width: '100%',
    height: 280,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  infoBlock: {
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
  appBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  skeletonLine: {
    height: 16,
    borderRadius: Radius.sm,
  },
  skeletonLineNarrow: {
    width: '50%',
  },
});
