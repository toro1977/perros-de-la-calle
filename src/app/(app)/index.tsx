import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar, TAB_BAR_HEIGHT } from '@/components/bottom-tab-bar';
import { MapPostsView } from '@/components/map-posts-view';
import { Skeleton } from '@/components/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentLocation } from '@/services/location';
import { useAuthStore } from '@/stores/authStore';
import { DogPostListItem, useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';
import { formatDistance } from '@/utils/format-distance';
import { tapHaptic } from '@/utils/haptics';
import { formatRelativeTime } from '@/utils/relative-time';

// No explicit "Todos" chip — tapping the active filter again clears it
// back to "all", the same pattern Instagram/Mercado Libre use. With four
// chips ("Encontrados"/"Callejeros" are long words) there isn't room for
// an extra one on a phone-width screen without shrinking text.
const FILTERS: { label: string; value: DogPostType }[] = [
  { label: 'Perdidos', value: 'lost' },
  { label: 'Encontrados', value: 'found' },
  { label: 'Callejeros', value: 'stray' },
];

export default function PostsListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const fadeHeight = TAB_BAR_HEIGHT + insets.bottom + Spacing.six;
  const profile = useAuthStore(s => s.profile);
  const posts = useDogPostsStore(s => s.posts);
  const fetchPosts = useDogPostsStore(s => s.fetchPosts);
  const isLoading = useDogPostsStore(s => s.isLoading);
  const [filter, setFilter] = useState<DogPostType | undefined>(undefined);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    getCurrentLocation()
      .then(loc => {
        if (loc) setCoords({ lat: loc.lat, lng: loc.lng });
      })
      .catch(() => {});
  }, []);

  const reload = useCallback(() => {
    fetchPosts({ lat: coords?.lat, lng: coords?.lng, type: filter });
  }, [coords, filter]);

  useFocusEffect(reload);

  function renderItem({ item }: { item: DogPostListItem }) {
    const secondaryParts = [
      item.distance_km != null ? formatDistance(item.distance_km) : null,
      item.breed || null,
    ].filter(Boolean);

    return (
      <Link href={{ pathname: '/post/[id]', params: { id: item.id } }} asChild>
        <Pressable
          onPress={tapHaptic}
          style={({ pressed }) =>
            StyleSheet.flatten([styles.card, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.9 : 1 }])
          }
        >
          <ThemedView style={styles.photoWrap}>
            <Image source={{ uri: item.photo_urls[0] }} style={styles.photo} contentFit="cover" />
            <ThemedView style={styles.photoBadge}>
              <StatusBadge type={item.type as DogPostType} variant="solid" size="sm" />
            </ThemedView>
            <ThemedView style={styles.photoTimestamp}>
              <ThemedText type="caption" style={styles.timestampText}>
                {formatRelativeTime(item.created_at)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView style={styles.cardInfo}>
            <ThemedText type="defaultBold" numberOfLines={1}>
              {item.zone_text}
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.header}>
          <ThemedView style={styles.headerText}>
            <ThemedText type="kicker" themeColor="textSecondary">
              Cerca tuyo
            </ThemedText>
            <ThemedText type="title" style={styles.title}>
              Perros de la calle
            </ThemedText>
            {profile?.full_name && (
              <ThemedText type="small" themeColor="textSecondary">
                Hola, {profile.full_name.split(' ')[0]}
              </ThemedText>
            )}
          </ThemedView>
          <ThemedView style={styles.headerActions}>
            <Pressable
              style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}
              onPress={() => setViewMode(m => (m === 'list' ? 'map' : 'list'))}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={viewMode === 'list' ? 'Ver mapa' : 'Ver lista'}
            >
              <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={20} color={theme.text} />
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.filters}>
          {FILTERS.map(f => {
            const active = filter === f.value;
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
                  setFilter(active ? undefined : f.value);
                }}
              >
                <ThemedText type="small" style={{ color: active ? theme.onAccent : theme.text, fontWeight: '600' }}>
                  {f.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        {profile?.role === 'shelter' && (
          <ThemedView style={[styles.banner, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
            <Ionicons name="home-outline" size={18} color={theme.accent} />
            <ThemedText type="small" style={{ color: theme.accent, flex: 1 }}>
              Cuenta de refugio — publicar en adopción llega en otra épica.
            </ThemedText>
          </ThemedView>
        )}

        {viewMode === 'list' ? (
          isLoading && posts.length === 0 ? (
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
                renderItem={renderItem}
                onRefresh={reload}
                refreshing={isLoading}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.three,
  },
  headerText: {
    gap: 4,
  },
  title: {
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  filterChip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
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
