import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet } from 'react-native';
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
import { useAuthStore } from '@/stores/authStore';
import { DogPostListItem, useDogPostsStore } from '@/stores/dogPostsStore';
import { useFeedViewStore } from '@/stores/feedViewStore';
import { DogPostType } from '@/types/database.types';
import { formatDistance } from '@/utils/format-distance';
import { tapHaptic } from '@/utils/haptics';
import { normalizeArPhone } from '@/utils/phone';
import { formatRelativeTime } from '@/utils/relative-time';
import { buildWhatsAppUrl } from '@/utils/whatsapp';

type StatusFilterOption = {
  value: DogPostType | undefined;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'accent' | 'danger' | 'success' | 'warning';
};

// "Todos" isn't a DogPostType, so it's the only literal entry here — the
// other three read their label/icon/tone straight off DOG_POST_TYPE_META
// so a type's look never has to be kept in sync in two places.
const STATUS_FILTERS: StatusFilterOption[] = [
  { value: undefined, label: 'Todos', icon: 'apps-outline', tone: 'accent' },
  { value: 'lost', label: DOG_POST_TYPE_META.lost.label, icon: DOG_POST_TYPE_META.lost.icon, tone: DOG_POST_TYPE_META.lost.tone },
  { value: 'found', label: DOG_POST_TYPE_META.found.label, icon: DOG_POST_TYPE_META.found.icon, tone: DOG_POST_TYPE_META.found.tone },
  { value: 'stray', label: DOG_POST_TYPE_META.stray.label, icon: DOG_POST_TYPE_META.stray.icon, tone: DOG_POST_TYPE_META.stray.tone },
];

// zone_text is "Localidad, Partido, Provincia" (see reverse-geocode Edge
// Function) — a card title needs just the first, most specific segment,
// or it either overflows or repeats "Buenos Aires" on every single card.
function localityOnly(zoneText: string) {
  return zoneText.split(',')[0].trim();
}

export default function PostsListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const fadeHeight = TAB_BAR_HEIGHT + insets.bottom + Spacing.six;
  const profile = useAuthStore(s => s.profile);
  const posts = useDogPostsStore(s => s.posts);
  const fetchPosts = useDogPostsStore(s => s.fetchPosts);
  const isLoadingPosts = useDogPostsStore(s => s.isLoading);
  const postsError = useDogPostsStore(s => s.error);
  const [statusFilter, setStatusFilter] = useState<DogPostType | undefined>(undefined);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const viewMode = useFeedViewStore(s => s.viewMode);
  const setViewMode = useFeedViewStore(s => s.setViewMode);

  useEffect(() => {
    getCurrentLocation()
      .then(loc => {
        if (loc) setCoords({ lat: loc.lat, lng: loc.lng });
      })
      .catch(() => {});
  }, []);

  const [pullRefreshing, setPullRefreshing] = useState(false);

  const reload = useCallback(() => {
    return fetchPosts({ lat: coords?.lat, lng: coords?.lng, type: statusFilter });
  }, [coords, statusFilter, fetchPosts]);

  // Silent background refetch — every tab focus (including switching back
  // from another tab, not just first mount) goes through here. Must NOT
  // drive the FlatList's `refreshing` prop (see handlePullRefresh below):
  // doing so used to fire the native pull-to-refresh spinner on every
  // tab-switch return, which visibly collided with the tab transition
  // animation.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
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
              {profile?.full_name ? `Hola, ${profile.full_name.split(' ')[0]}` : 'Hola!'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Avisos cerca tuyo
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.controlsRow}>
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
        </ThemedView>

        <FilterChips statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

        {viewMode === 'list' ? (
          postsError && posts.length === 0 ? (
            <ThemedView style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={32} color={theme.textSecondary} />
              <ThemedText type="default" style={styles.emptyTitle}>
                No pudimos cargar los avisos
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Revisá tu conexión e intentá de nuevo.
              </ThemedText>
              <Button label="Reintentar" variant="secondary" onPress={reload} />
            </ThemedView>
          ) : isLoadingPosts && posts.length === 0 ? (
            <ThemedView style={styles.listContent}>
              {[0, 1, 2].map(i => (
                <PostCardSkeleton key={i} />
              ))}
            </ThemedView>
          ) : (
            <ThemedView style={styles.listWrap}>
              <FlatList
                data={posts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <PostCard item={item} />}
                onRefresh={handlePullRefresh}
                refreshing={pullRefreshing}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.listContent, { paddingBottom: fadeHeight }]}
                ListEmptyComponent={
                  <ThemedView style={styles.empty}>
                    <Ionicons name="paw-outline" size={32} color={theme.textSecondary} />
                    <ThemedText type="default" style={styles.emptyTitle}>
                      Todavía no hay avisos por acá
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                      ¿Viste un perro perdido, encontrado o callejero? Sé el primero en publicarlo.
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

// Plain flex-wrap grid, not a scroll — every chip must be visible without
// a hidden gesture (see docs/rediseno-v3.md and the simplificacion-feed
// brief: the old horizontal-scroll row hid "Callejeros" off-screen).
// 2x2 also sidesteps the New Architecture bug where a horizontal
// ScrollView/FlatList mounted as a sibling of this screen's main FlatList
// silently fails to render — a non-scrolling wrap has no such risk.
function FilterChips({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: DogPostType | undefined;
  setStatusFilter: (value: DogPostType | undefined) => void;
}) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.filters}>
      {STATUS_FILTERS.map(f => {
        const active = statusFilter === f.value;
        const toneColor = theme[f.tone];
        const toneSoft = theme[`${f.tone}Soft` as const];
        return (
          <Pressable
            key={f.label}
            style={[
              styles.filterChip,
              {
                backgroundColor: active ? toneSoft : theme.backgroundElement,
                borderColor: active ? toneColor : theme.border,
                borderWidth: active ? 2 : 1,
              },
            ]}
            onPress={() => {
              tapHaptic();
              setStatusFilter(f.value);
            }}
            accessibilityRole="button"
            accessibilityLabel={f.label}
          >
            <Ionicons name={f.icon} size={18} color={active ? toneColor : theme.textSecondary} />
            <ThemedText type="small" style={{ color: active ? toneColor : theme.text, fontWeight: '700' }}>
              {f.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

// Any remote image can fail to load (upload never finished, storage
// hiccup, empty photo_urls) — falls back to a placeholder icon instead
// of a blank hole where the most important element of the card should be.
// The list RPC (list_dog_posts) never returns contact_phone — it's only
// revealed by the get_dog_post detail RPC, on demand, so the number
// isn't sitting in a bulk-readable feed response. Contacting from the
// card fetches it lazily, same as the detail screen does.
function PostCard({ item }: { item: DogPostListItem }) {
  const theme = useTheme();
  const getPost = useDogPostsStore(s => s.getPost);
  const [imageFailed, setImageFailed] = useState(false);
  const [contactState, setContactState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [pressed, setPressed] = useState(false);
  const hasPhoto = item.photo_urls.length > 0 && !imageFailed;
  const secondaryParts = [
    item.breed || null,
    item.distance_km != null ? formatDistance(item.distance_km) : null,
    formatRelativeTime(item.created_at),
  ].filter(Boolean);

  async function handleContact() {
    tapHaptic();
    setContactState('loading');
    try {
      const detail = await getPost(item.id);
      const normalizedPhone = detail?.contact_phone ? normalizeArPhone(detail.contact_phone) : null;
      if (!normalizedPhone) {
        setContactState('error');
        setTimeout(() => setContactState('idle'), 2000);
        return;
      }
      await Linking.openURL(buildWhatsAppUrl(normalizedPhone, item.zone_text));
      setContactState('idle');
    } catch {
      setContactState('error');
      setTimeout(() => setContactState('idle'), 2000);
    }
  }

  return (
    <Link href={{ pathname: '/post/[id]', params: { id: item.id } }} asChild>
      {/* Link asChild clones this Pressable via a Slot whose prop-merge does
          `{ ...slotStyle, ...childStyle }` — if childStyle were a function
          (the usual `style={({pressed}) => ...}` Pressable pattern), spreading
          a function yields `{}` and the entire style (border, radius, shadow)
          silently vanishes, no error. Track `pressed` by hand instead so the
          style prop is always a plain flattened object. */}
      <Pressable
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
            <StatusBadge meta={DOG_POST_TYPE_META[item.type as DogPostType]} variant="solid" size="sm" />
          </ThemedView>
        </ThemedView>
        <ThemedView style={[styles.cardInfo, styles.cardInfoRow, { backgroundColor: theme.surface, borderTopColor: theme.borderStrong }]}>
          <ThemedView style={[styles.cardInfoLeft, { backgroundColor: theme.surface }]}>
            <ThemedText type="defaultBold" numberOfLines={1}>
              {localityOnly(item.zone_text)}
            </ThemedText>
            {secondaryParts.length > 0 && (
              <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                {secondaryParts.join(' · ')}
              </ThemedText>
            )}
          </ThemedView>
          <Pressable
            onPress={handleContact}
            disabled={contactState === 'loading'}
            style={({ pressed }) => [
              styles.contactButton,
              {
                borderColor: contactState === 'error' ? theme.textSecondary : theme.accent,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            {contactState === 'loading' ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Ionicons
                name={contactState === 'error' ? 'alert-outline' : 'logo-whatsapp'}
                size={20}
                color={contactState === 'error' ? theme.textSecondary : theme.accent}
              />
            )}
          </Pressable>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

function PostCardSkeleton() {
  const theme = useTheme();
  return (
    <ThemedView style={[styles.card, { backgroundColor: theme.surface }]}>
      <Skeleton style={styles.photoWrap} />
      <ThemedView style={[styles.cardInfo, { backgroundColor: theme.surface, borderTopColor: theme.borderStrong }]}>
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
    justifyContent: 'flex-end',
    marginBottom: Spacing.three,
  },
  viewIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: Radius.full,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  // 2 per row (48%), not 4 — icon + label at a >=44px tap target doesn't
  // fit four across on a standard phone width without shrinking below a
  // readable/tappable size. Wrapping to 2 rows keeps every chip visible
  // with no scroll, same fixed-grid approach new-post.tsx already uses
  // for its own 4-option type selector.
  filterChip: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one + 2,
    minHeight: 48,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
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
  // No border: at 1-1.5px, combined with overflow:'hidden' + borderRadius,
  // it read as a dark seam where the photo meets the rounded corner instead
  // of a clean edge. Separation from the background comes from the shadow
  // alone now.
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
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardInfoLeft: {
    flex: 1,
    gap: 2,
  },
  contactButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1.5,
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
