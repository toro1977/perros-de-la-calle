import { useCallback, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPostsView } from '@/components/map-posts-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { getCurrentLocation } from '@/services/location';
import { useAuthStore } from '@/stores/authStore';
import { DogPostListItem, useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';

const TYPE_LABELS: Record<DogPostType, string> = {
  lost: 'Perdido',
  found: 'Encontrado',
  stray: 'Callejero',
};

const FILTERS: { label: string; value: DogPostType | undefined }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Perdidos', value: 'lost' },
  { label: 'Encontrados', value: 'found' },
  { label: 'Callejeros', value: 'stray' },
];

export default function PostsListScreen() {
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
    return (
      <Link href={{ pathname: '/post/[id]', params: { id: item.id } }} asChild>
        <Pressable style={styles.card}>
          <Image source={{ uri: item.photo_url }} style={styles.thumbnail} contentFit="cover" />
          <ThemedView style={styles.cardInfo}>
            <ThemedText type="smallBold">{TYPE_LABELS[item.type as DogPostType]}</ThemedText>
            <ThemedText type="default">{item.zone_text}</ThemedText>
            {item.distance_km != null && (
              <ThemedText type="small" themeColor="textSecondary">
                a {item.distance_km} km
              </ThemedText>
            )}
          </ThemedView>
        </Pressable>
      </Link>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Perros de la calle
          </ThemedText>
          <ThemedView style={styles.headerActions}>
            <Pressable onPress={() => setViewMode(m => (m === 'list' ? 'map' : 'list'))}>
              <ThemedText type="link">{viewMode === 'list' ? 'Ver mapa' : 'Ver lista'}</ThemedText>
            </Pressable>
            <Pressable onPress={signOut}>
              <ThemedText type="link">Salir</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.filters}>
          {FILTERS.map(f => (
            <Pressable
              key={f.label}
              style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
              onPress={() => setFilter(f.value)}
            >
              <ThemedText type="small">{f.label}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>

        {viewMode === 'list' ? (
          <FlatList
            data={posts}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            onRefresh={reload}
            refreshing={isLoading}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText type="default" style={styles.empty}>
                {isLoading ? 'Cargando...' : 'No hay avisos por acá todavía.'}
              </ThemedText>
            }
          />
        ) : (
          <MapPostsView posts={posts} center={coords} />
        )}

        <Link href="/new-post" asChild>
          <Pressable style={styles.fab}>
            <ThemedText type="default" style={styles.fabText}>
              + Publicar
            </ThemedText>
          </Pressable>
        </Link>

        {profile?.role === 'shelter' && (
          <ThemedText type="small" style={styles.hint}>
            Cuenta de refugio — la publicación en adopción llega en otra épica.
          </ThemedText>
        )}
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
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  filterChipActive: {
    borderColor: '#3c87f7',
    borderWidth: 2,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: Spacing.two,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.three,
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  fabText: {
    color: '#ffffff',
  },
  hint: {
    textAlign: 'center',
    paddingBottom: Spacing.two,
  },
});
