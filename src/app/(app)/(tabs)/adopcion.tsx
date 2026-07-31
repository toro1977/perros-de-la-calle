import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar, TAB_BAR_HEIGHT } from '@/components/bottom-tab-bar';
import { Button } from '@/components/button';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ADOPTION_STATUS_META } from '@/constants/adoption-status';
import { VERIFIED_BADGE_META } from '@/constants/shelter-verification';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AdoptionDogListItem, useAdoptionDogsStore } from '@/stores/adoptionDogsStore';
import { useAuthStore } from '@/stores/authStore';
import { useShelterStore } from '@/stores/shelterStore';
import { AdoptionDogStatus } from '@/types/database.types';
import { tapHaptic } from '@/utils/haptics';

// Adopción is its own destination, not a feed mode: no urgency, no
// location filter, no lost/found/stray chips (they don't apply to a dog
// already safe at a shelter) — see the simplificacion-feed brief.
export default function AdoptionScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const fadeHeight = TAB_BAR_HEIGHT + insets.bottom + Spacing.six;
  const profile = useAuthStore(s => s.profile);
  const dogs = useAdoptionDogsStore(s => s.dogs);
  const fetchAdoptionDogs = useAdoptionDogsStore(s => s.fetchAdoptionDogs);
  const isLoading = useAdoptionDogsStore(s => s.isLoading);
  const fetchError = useAdoptionDogsStore(s => s.error);
  const shelter = useShelterStore(s => s.shelter);
  const fetchMyShelter = useShelterStore(s => s.fetchMyShelter);
  const isVerifiedShelter = shelter?.verification_status === 'approved';

  const [pullRefreshing, setPullRefreshing] = useState(false);

  const reload = useCallback(() => fetchAdoptionDogs(), [fetchAdoptionDogs]);

  // Same silent-refetch-on-focus pattern as the Feed and Mis avisos
  // screens — must not drive FlatList's `refreshing`, only the manual
  // pull gesture does (see (tabs)/index.tsx for why).
  useFocusEffect(
    useCallback(() => {
      reload();
      if (profile?.id) fetchMyShelter(profile.id);
    }, [reload, profile, fetchMyShelter])
  );

  async function handlePullRefresh() {
    setPullRefreshing(true);
    await reload();
    setPullRefreshing(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.header}>
          <ThemedView style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Adopción
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Perros de refugios buscando familia
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {isVerifiedShelter && (
          <Pressable
            onPress={() => {
              tapHaptic();
              router.push({ pathname: '/new-post', params: { type: 'adoption' } });
            }}
            style={({ pressed }) => [
              styles.banner,
              { backgroundColor: theme.accentSoft, borderColor: theme.accent, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Publicar un perro en adopción"
          >
            <ThemedView style={[styles.bannerIcon, { backgroundColor: theme.accent }]}>
              <Ionicons name="add" size={18} color={theme.onAccent} />
            </ThemedView>
            <ThemedText type="small" style={{ color: theme.accent, flex: 1, fontWeight: '600' }}>
              Publicar un perro en adopción
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color={theme.accent} />
          </Pressable>
        )}

        {fetchError && dogs.length === 0 ? (
          <ThemedView style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={32} color={theme.textSecondary} />
            <ThemedText type="default" style={styles.emptyTitle}>
              No pudimos cargar los perros en adopción
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Revisá tu conexión e intentá de nuevo.
            </ThemedText>
            <Button label="Reintentar" variant="secondary" onPress={reload} />
          </ThemedView>
        ) : (
          <ThemedView style={styles.listWrap}>
            <FlatList
              data={dogs}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <AdoptionDogCard item={item} />}
              onRefresh={handlePullRefresh}
              refreshing={pullRefreshing}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.listContent, { paddingBottom: fadeHeight }]}
              ListEmptyComponent={
                !isLoading ? (
                  <ThemedView style={styles.empty}>
                    <Ionicons name="paw-outline" size={32} color={theme.textSecondary} />
                    <ThemedText type="default" style={styles.emptyTitle}>
                      Todavía no hay perros en adopción
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                      Los refugios todavía no publicaron perros en adopción.
                    </ThemedText>
                  </ThemedView>
                ) : undefined
              }
            />
            {/* Fades cards into the background before they reach the
                floating tab bar, instead of them hard-cutting behind it. */}
            <LinearGradient
              pointerEvents="none"
              colors={[`${theme.background}00`, theme.background]}
              locations={[0, 0.75]}
              style={[styles.listFade, { height: fadeHeight }]}
            />
          </ThemedView>
        )}
      </SafeAreaView>

      <BottomTabBar />
    </ThemedView>
  );
}

function AdoptionDogCard({ item }: { item: AdoptionDogListItem }) {
  const theme = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const [pressed, setPressed] = useState(false);
  const hasPhoto = item.photo_urls.length > 0 && !imageFailed;
  const secondaryParts = [item.shelter_name, item.breed || null].filter(Boolean);

  return (
    <Link href={{ pathname: '/adoption/[id]', params: { id: item.id } }} asChild>
      {/* See the matching comment in (tabs)/index.tsx's PostCard: style
          must stay a plain object here, never a `({pressed}) => ...`
          function, or Link asChild's Slot silently drops the whole style
          on merge. */}
      <Pressable
        testID="adoption-card"
        onPress={tapHaptic}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={StyleSheet.flatten([
          styles.card,
          { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
        ])}
      >
        <ThemedView style={styles.photoWrap}>
          {hasPhoto ? (
            <Image
              source={{ uri: item.photo_urls[0] }}
              style={styles.photo}
              contentFit="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <ThemedView style={[styles.photoFallback, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="paw" size={32} color={theme.textSecondary} />
            </ThemedView>
          )}
          <ThemedView style={styles.photoBadge}>
            <StatusBadge
              meta={ADOPTION_STATUS_META[item.status as AdoptionDogStatus]}
              variant="solid"
              size="sm"
            />
          </ThemedView>
        </ThemedView>
        <ThemedView style={[styles.cardInfo, { backgroundColor: theme.surface, borderTopColor: theme.borderStrong }]}>
          <ThemedText type="defaultBold" numberOfLines={1}>
            {item.name || 'Perro en adopción'}
          </ThemedText>
          {secondaryParts.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {secondaryParts.join(' · ')}
            </ThemedText>
          )}
          {item.verification_status === 'approved' && <StatusBadge meta={VERIFIED_BADGE_META} size="sm" />}
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    paddingVertical: Spacing.three,
  },
  headerText: {
    gap: 4,
  },
  title: {
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.two + 2,
    marginBottom: Spacing.three,
  },
  bannerIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    gap: 10,
  },
  listFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  photoWrap: {
    width: '100%',
    aspectRatio: 2,
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
  photoBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: 'transparent',
  },
  cardInfo: {
    gap: 4,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
