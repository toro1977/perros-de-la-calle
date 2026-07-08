import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPostsView } from '@/components/map-posts-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DOG_POST_TYPE_META } from '@/constants/dog-post-types';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentLocation } from '@/services/location';
import { useAuthStore } from '@/stores/authStore';
import { DogPostListItem, useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';

const FILTERS: { label: string; value: DogPostType | undefined; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Todos', value: undefined, icon: 'apps-outline' },
  { label: 'Perdidos', value: 'lost', icon: 'help-buoy-outline' },
  { label: 'Encontrados', value: 'found', icon: 'checkmark-circle-outline' },
  { label: 'Callejeros', value: 'stray', icon: 'paw-outline' },
];

export default function PostsListScreen() {
  const theme = useTheme();
  const profile = useAuthStore(s => s.profile);
  const signOut = useAuthStore(s => s.signOut);
  const posts = useDogPostsStore(s => s.posts);
  const fetchPosts = useDogPostsStore(s => s.fetchPosts);
  const isLoading = useDogPostsStore(s => s.isLoading);
  const [filter, setFilter] = useState<DogPostType | undefined>(undefined);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    getCurrentLocation().then(loc => {
      if (loc) setCoords({ lat: loc.lat, lng: loc.lng });
    });
  }, []);

  const reload = useCallback(() => {
    fetchPosts({ lat: coords?.lat, lng: coords?.lng, type: filter });
  }, [coords, filter]);

  useFocusEffect(reload);

  function renderItem({ item }: { item: DogPostListItem }) {
    const meta = DOG_POST_TYPE_META[item.type as DogPostType];
    const toneColor = theme[meta.tone];
    const toneSoft = theme[`${meta.tone}Soft` as const];
    return (
      <Link href={{ pathname: '/post/[id]', params: { id: item.id } }} asChild>
        <Pressable
          style={({ pressed }) =>
            StyleSheet.flatten([styles.card, { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 }])
          }
        >
          <Image source={{ uri: item.photo_url }} style={styles.thumbnail} contentFit="cover" />
          <ThemedView style={styles.cardInfo}>
            <ThemedView style={[styles.badge, { backgroundColor: toneSoft }]}>
              <Ionicons name={meta.icon} size={12} color={toneColor} />
              <ThemedText type="caption" style={{ color: toneColor }}>
                {meta.label}
              </ThemedText>
            </ThemedView>
            <ThemedText type="default" style={styles.cardZone}>
              {item.zone_text}
            </ThemedText>
            {item.distance_km != null && (
              <ThemedText type="small" themeColor="textSecondary">
                a {item.distance_km} km
              </ThemedText>
            )}
          </ThemedView>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </Pressable>
      </Link>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedView>
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
            >
              <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={20} color={theme.text} />
            </Pressable>
            <Pressable style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]} onPress={signOut} hitSlop={8}>
              <Ionicons name="log-out-outline" size={20} color={theme.text} />
            </Pressable>
          </ThemedView>
        </ThemedView>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={f => f.label}
          contentContainerStyle={styles.filters}
          renderItem={({ item: f }) => {
            const active = filter === f.value;
            return (
              <Pressable
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.accent : theme.backgroundElement,
                    borderColor: active ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => setFilter(f.value)}
              >
                <Ionicons name={f.icon} size={14} color={active ? theme.onAccent : theme.textSecondary} />
                <ThemedText type="small" style={{ color: active ? theme.onAccent : theme.text, fontWeight: '600' }}>
                  {f.label}
                </ThemedText>
              </Pressable>
            );
          }}
        />

        {profile?.role === 'shelter' && (
          <ThemedView style={[styles.banner, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
            <Ionicons name="home-outline" size={18} color={theme.accent} />
            <ThemedText type="small" style={{ color: theme.accent, flex: 1 }}>
              Cuenta de refugio — publicar en adopción llega en otra épica.
            </ThemedText>
          </ThemedView>
        )}

        {viewMode === 'list' ? (
          <FlatList
            data={posts}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            onRefresh={reload}
            refreshing={isLoading}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedView style={styles.empty}>
                <Ionicons name="paw-outline" size={32} color={theme.textSecondary} />
                <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
                  {isLoading ? 'Cargando...' : 'No hay avisos por acá todavía.'}
                </ThemedText>
              </ThemedView>
            }
          />
        ) : (
          <ThemedView style={styles.mapWrap}>
            <MapPostsView posts={posts} center={coords} />
          </ThemedView>
        )}

        <Link href="/new-post" asChild>
          <Pressable style={StyleSheet.flatten([styles.fab, { backgroundColor: theme.accent }])}>
            <Ionicons name="add" size={20} color={theme.onAccent} />
            <ThemedText type="default" style={[styles.fabText, { color: theme.onAccent }]}>
              Publicar
            </ThemedText>
          </Pressable>
        </Link>
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
  title: {
    fontSize: 24,
    lineHeight: 28,
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
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
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
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  cardZone: {
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
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
  fab: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.full,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  fabText: {
    fontWeight: '700',
  },
});
