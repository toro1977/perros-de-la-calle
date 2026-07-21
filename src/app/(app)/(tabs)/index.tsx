import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar, TAB_BAR_HEIGHT } from '@/components/bottom-tab-bar';
import { Button } from '@/components/button';
import { MapPostsView } from '@/components/map-posts-view';
import { Skeleton } from '@/components/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DOG_POST_TYPE_META } from '@/constants/dog-post-types';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentLocation } from '@/services/location';
import { AdoptionDogListItem, useAdoptionDogsStore } from '@/stores/adoptionDogsStore';
import { useAuthStore } from '@/stores/authStore';
import { DogPostListItem, useDogPostsStore } from '@/stores/dogPostsStore';
import { useFeedViewStore } from '@/stores/feedViewStore';
import { DogPostType } from '@/types/database.types';
import { formatDistance } from '@/utils/format-distance';
import { tapHaptic } from '@/utils/haptics';
import { formatRelativeTime } from '@/utils/relative-time';

type FeedMode = 'rescue' | 'adoption';

// "Todos" is the only way back to the unfiltered state — tapping an
// already-active chip is a no-op, unlike the old toggle-off behavior.
const STATUS_FILTERS: { label: string; value: DogPostType | undefined }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Perdidos', value: 'lost' },
  { label: 'Encontrados', value: 'found' },
  { label: 'Callejeros', value: 'stray' },
];

// zone_text is "Localidad, Partido, Provincia" (see reverse-geocode Edge
// Function) — a card title needs just the first, most specific segment,
// or it either overflows or repeats "Buenos Aires" on every single card.
function localityOnly(zoneText: string) {
  return zoneText.split(',')[0].trim();
}

const ADOPTION_BADGE_META = { label: 'En adopción', icon: 'home' as const, tone: 'success' as const };

export default function PostsListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const fadeHeight = TAB_BAR_HEIGHT + insets.bottom + Spacing.six;
  const profile = useAuthStore(s => s.profile);
  const posts = useDogPostsStore(s => s.posts);
  const fetchPosts = useDogPostsStore(s => s.fetchPosts);
  const isLoadingPosts = useDogPostsStore(s => s.isLoading);
  const postsError = useDogPostsStore(s => s.error);
  const adoptionDogs = useAdoptionDogsStore(s => s.dogs);
  const fetchAdoptionDogs = useAdoptionDogsStore(s => s.fetchAdoptionDogs);
  const isLoadingAdoption = useAdoptionDogsStore(s => s.isLoading);
  const adoptionError = useAdoptionDogsStore(s => s.error);
  const [mode, setMode] = useState<FeedMode>('rescue');
  const [statusFilter, setStatusFilter] = useState<DogPostType | undefined>(undefined);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const viewMode = useFeedViewStore(s => s.viewMode);
  const setViewMode = useFeedViewStore(s => s.setViewMode);
  const isAdoptionMode = mode === 'adoption';
  const listData = isAdoptionMode ? adoptionDogs : posts;
  const isLoading = isAdoptionMode ? isLoadingAdoption : isLoadingPosts;
  const fetchError = isAdoptionMode ? adoptionError : postsError;

  useEffect(() => {
    getCurrentLocation()
      .then(loc => {
        if (loc) setCoords({ lat: loc.lat, lng: loc.lng });
      })
      .catch(() => {});
  }, []);

  const reload = useCallback(() => {
    if (mode === 'adoption') {
      fetchAdoptionDogs();
    } else {
      fetchPosts({ lat: coords?.lat, lng: coords?.lng, type: statusFilter });
    }
  }, [coords, mode, statusFilter, fetchAdoptionDogs, fetchPosts]);

  useFocusEffect(reload);

  function renderItem({ item }: { item: DogPostListItem | AdoptionDogListItem }) {
    return 'zone_text' in item ? <PostCard item={item} /> : <AdoptionDogCard item={item} />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.header}>
          <ThemedView style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              {profile?.full_name ? `Hola, ${profile.full_name.split(' ')[0]}` : 'Hola!'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {isAdoptionMode ? 'Perros en adopción cerca tuyo' : 'Avisos cerca tuyo'}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* One row for both controls — mode is the primary axis (what you
            see), view is secondary (how you see it) and only applies to
            Rescate, so it collapses to a single icon button instead of
            competing with the segmented control for attention. */}
        <ThemedView style={styles.controlsRow}>
          <ThemedView style={[styles.segmented, { backgroundColor: theme.backgroundElement }]}>
            <Pressable
              style={[styles.segmentedOption, mode === 'rescue' && { backgroundColor: theme.surface }]}
              onPress={() => {
                tapHaptic();
                setMode('rescue');
              }}
              accessibilityRole="button"
              accessibilityLabel="Rescate"
            >
              <ThemedText
                type="small"
                style={{ color: mode === 'rescue' ? theme.text : theme.textSecondary, fontWeight: '700' }}
              >
                Rescate
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.segmentedOption, mode === 'adoption' && { backgroundColor: theme.surface }]}
              onPress={() => {
                tapHaptic();
                setMode('adoption');
              }}
              accessibilityRole="button"
              accessibilityLabel="Adopción"
            >
              <ThemedText
                type="small"
                style={{ color: mode === 'adoption' ? theme.text : theme.textSecondary, fontWeight: '700' }}
              >
                Adopción
              </ThemedText>
            </Pressable>
          </ThemedView>

          {!isAdoptionMode && (
            <Pressable
              style={[styles.viewIconButton, { backgroundColor: theme.backgroundElement }]}
              onPress={() => {
                tapHaptic();
                setViewMode(viewMode === 'list' ? 'map' : 'list');
              }}
              accessibilityRole="button"
              accessibilityLabel={viewMode === 'list' ? 'Ver mapa' : 'Ver lista'}
            >
              <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={18} color={theme.text} />
            </Pressable>
          )}
        </ThemedView>

        {!isAdoptionMode && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            style={styles.filtersScroll}
          >
            {STATUS_FILTERS.map(f => {
              const active = statusFilter === f.value;
              return (
                <Pressable
                  key={f.label}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? theme.accent : theme.backgroundElement,
                      borderColor: active ? theme.accent : theme.border,
                    },
                  ]}
                  onPress={() => {
                    tapHaptic();
                    setStatusFilter(f.value);
                  }}
                >
                  <ThemedText type="small" style={{ color: active ? theme.onAccent : theme.text, fontWeight: '600' }}>
                    {f.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {isAdoptionMode && profile?.role === 'shelter' && (
          <Pressable
            onPress={() => {
              tapHaptic();
              router.push({ pathname: '/new-post', params: { type: 'adoption' } });
            }}
            style={({ pressed }) => [
              styles.banner,
              { backgroundColor: theme.accentSoft, borderColor: theme.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="home-outline" size={18} color={theme.accent} />
            <ThemedText type="small" style={{ color: theme.accent, flex: 1 }}>
              ¿Sos refugio? Publicá un perro en adopción.
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color={theme.accent} />
          </Pressable>
        )}

        {isAdoptionMode || viewMode === 'list' ? (
          fetchError && listData.length === 0 ? (
            <ThemedView style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={32} color={theme.textSecondary} />
              <ThemedText type="default" style={styles.emptyTitle}>
                {isAdoptionMode ? 'No pudimos cargar los perros en adopción' : 'No pudimos cargar los avisos'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Revisá tu conexión e intentá de nuevo.
              </ThemedText>
              <Button label="Reintentar" variant="secondary" onPress={reload} />
            </ThemedView>
          ) : isLoading && listData.length === 0 ? (
            <ThemedView style={styles.listContent}>
              {[0, 1, 2].map(i => (
                <PostCardSkeleton key={i} />
              ))}
            </ThemedView>
          ) : (
            <ThemedView style={styles.listWrap}>
              <FlatList
                data={listData}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                onRefresh={reload}
                refreshing={isLoading}
                contentContainerStyle={[styles.listContent, { paddingBottom: fadeHeight }]}
                ListEmptyComponent={
                  <ThemedView style={styles.empty}>
                    <Ionicons name="paw-outline" size={32} color={theme.textSecondary} />
                    <ThemedText type="default" style={styles.emptyTitle}>
                      {isAdoptionMode ? 'Todavía no hay perros en adopción' : 'Todavía no hay avisos por acá'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                      {isAdoptionMode
                        ? 'Los refugios todavía no publicaron perros en adopción.'
                        : '¿Viste un perro perdido, encontrado o callejero? Sé el primero en publicarlo.'}
                    </ThemedText>
                  </ThemedView>
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
          )
        ) : (
          <ThemedView style={styles.mapWrap}>
            <MapPostsView posts={posts} center={coords} />
          </ThemedView>
        )}
      </SafeAreaView>

      <BottomTabBar />
    </ThemedView>
  );
}

// Any remote image can fail to load (upload never finished, storage
// hiccup, empty photo_urls) — falls back to a placeholder icon instead
// of a blank hole where the most important element of the card should be.
function PostCard({ item }: { item: DogPostListItem }) {
  const theme = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const hasPhoto = item.photo_urls.length > 0 && !imageFailed;
  const secondaryParts = [item.distance_km != null ? formatDistance(item.distance_km) : null, item.breed || null].filter(Boolean);

  return (
    <Link href={{ pathname: '/post/[id]', params: { id: item.id } }} asChild>
      <Pressable
        onPress={tapHaptic}
        style={({ pressed }) =>
          StyleSheet.flatten([styles.card, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.9 : 1 }])
        }
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
            <StatusBadge meta={DOG_POST_TYPE_META[item.type as DogPostType]} variant="solid" size="sm" />
          </ThemedView>
          <ThemedView style={styles.photoTimestamp}>
            <ThemedText type="caption" style={styles.timestampText}>
              {formatRelativeTime(item.created_at)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView style={styles.cardInfo}>
          <ThemedText type="defaultBold" numberOfLines={1}>
            {localityOnly(item.zone_text)}
          </ThemedText>
          {secondaryParts.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              {secondaryParts.join(' · ')}
            </ThemedText>
          )}
        </ThemedView>
      </Pressable>
    </Link>
  );
}

function AdoptionDogCard({ item }: { item: AdoptionDogListItem }) {
  const theme = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const hasPhoto = item.photo_urls.length > 0 && !imageFailed;
  const secondaryParts = [item.shelter_name, item.breed || null].filter(Boolean);

  return (
    <Link href={{ pathname: '/adoption/[id]', params: { id: item.id } }} asChild>
      <Pressable
        onPress={tapHaptic}
        style={({ pressed }) =>
          StyleSheet.flatten([styles.card, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.9 : 1 }])
        }
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
            <StatusBadge meta={ADOPTION_BADGE_META} variant="solid" size="sm" />
          </ThemedView>
        </ThemedView>
        <ThemedView style={styles.cardInfo}>
          <ThemedText type="defaultBold" numberOfLines={1}>
            {item.name || 'Perro en adopción'}
          </ThemedText>
          {secondaryParts.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {secondaryParts.join(' · ')}
            </ThemedText>
          )}
        </ThemedView>
      </Pressable>
    </Link>
  );
}

function PostCardSkeleton() {
  const theme = useTheme();
  return (
    <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Skeleton style={styles.photoWrap} />
      <ThemedView style={styles.cardInfo}>
        <Skeleton style={[styles.skeletonLine, styles.skeletonLineWide]} />
        <Skeleton style={[styles.skeletonLine, styles.skeletonLineNarrow]} />
      </ThemedView>
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
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  segmented: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    padding: 2,
  },
  segmentedOption: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
  },
  viewIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: Radius.full,
  },
  // A horizontal ScrollView is a flex container: inside a flex-column
  // parent it doesn't size its height to content — it collapses to 0 and
  // the chips silently never appear. `flexGrow: 0` is the fix used by the
  // other horizontal scrollers in this app (see thumbRowScroll in
  // new-post.tsx); the explicit height guarantees the row is visible.
  filtersScroll: {
    flexGrow: 0,
    height: 40,
    marginBottom: Spacing.three,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  filterChip: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
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
  listWrap: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.four,
  },
  listFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  photoWrap: {
    width: '100%',
    height: 190,
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
  photoTimestamp: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  timestampText: {
    color: '#FFFFFF',
  },
  cardInfo: {
    gap: 4,
    padding: Spacing.three,
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
  mapWrap: {
    flex: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  skeletonLine: {
    height: 14,
    borderRadius: Radius.sm,
  },
  skeletonLineWide: {
    width: '70%',
  },
  skeletonLineNarrow: {
    width: '40%',
  },
});
