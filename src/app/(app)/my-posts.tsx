import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router, useFocusEffect } from 'expo-router';
import { Alert, Pressable, SectionList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar, TAB_BAR_HEIGHT } from '@/components/bottom-tab-bar';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ADOPTION_STATUS_META } from '@/constants/adoption-status';
import { DOG_POST_TYPE_META } from '@/constants/dog-post-types';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MyAdoptionDog, useAdoptionDogsStore } from '@/stores/adoptionDogsStore';
import { useAuthStore } from '@/stores/authStore';
import { MyDogPost, useDogPostsStore } from '@/stores/dogPostsStore';
import { AdoptionDogStatus, DogPostType } from '@/types/database.types';
import { tapHaptic } from '@/utils/haptics';
import { formatRelativeTime } from '@/utils/relative-time';

const ADOPTION_STATUS_ORDER: AdoptionDogStatus[] = ['available', 'in_process', 'adopted'];

export default function MyPostsScreen() {
  const theme = useTheme();
  const profile = useAuthStore(s => s.profile);
  const isShelter = profile?.role === 'shelter';
  const myPosts = useDogPostsStore(s => s.myPosts);
  const fetchMyPosts = useDogPostsStore(s => s.fetchMyPosts);
  const deletePost = useDogPostsStore(s => s.deletePost);
  const isLoadingPosts = useDogPostsStore(s => s.isLoading);
  const myAdoptionDogs = useAdoptionDogsStore(s => s.myDogs);
  const fetchMyAdoptionDogs = useAdoptionDogsStore(s => s.fetchMyAdoptionDogs);
  const deleteAdoptionDog = useAdoptionDogsStore(s => s.deleteAdoptionDog);
  const updateAdoptionDogStatus = useAdoptionDogsStore(s => s.updateAdoptionDogStatus);
  const isLoadingAdoption = useAdoptionDogsStore(s => s.isLoading);

  const reload = useCallback(() => {
    if (!profile?.id) return;
    fetchMyPosts(profile.id);
    if (isShelter) fetchMyAdoptionDogs(profile.id);
  }, [profile?.id, isShelter]);

  useFocusEffect(reload);

  function handleDelete(post: MyDogPost) {
    Alert.alert('Borrar aviso', '¿Seguro que querés borrarlo? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => deletePost(post.id) },
    ]);
  }

  function handleDeleteAdoption(dog: MyAdoptionDog) {
    Alert.alert('Borrar publicación', '¿Seguro que querés borrarla? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => deleteAdoptionDog(dog.id) },
    ]);
  }

  function handleChangeStatus(dog: MyAdoptionDog) {
    const options = ADOPTION_STATUS_ORDER.filter(s => s !== dog.status);
    Alert.alert(
      'Cambiar estado',
      dog.name ?? undefined,
      [
        ...options.map(status => ({
          text: ADOPTION_STATUS_META[status].label,
          onPress: () => updateAdoptionDogStatus(dog.id, status),
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ]
    );
  }

  function renderPost(item: MyDogPost) {
    const resolved = item.status === 'resolved';
    return (
      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Pressable
          onPress={() => {
            tapHaptic();
            router.push({ pathname: '/post/[id]', params: { id: item.id } });
          }}
          style={({ pressed }) => [styles.cardBody, { opacity: pressed ? 0.9 : 1 }]}
        >
          <ThemedView style={styles.photoWrap}>
            <Image source={{ uri: item.photo_urls[0] }} style={styles.photo} contentFit="cover" />
            <ThemedView style={styles.photoBadge}>
              <StatusBadge meta={DOG_POST_TYPE_META[item.type as DogPostType]} variant="solid" size="sm" />
            </ThemedView>
            {resolved && (
              <ThemedView style={styles.resolvedOverlay}>
                <ThemedText type="small" style={styles.resolvedText}>
                  Resuelto
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
          <ThemedView style={styles.cardInfo}>
            <ThemedText type="defaultBold" numberOfLines={1}>
              {item.zone_text}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.breed ? `${item.breed} · ` : ''}
              {formatRelativeTime(item.created_at)}
            </ThemedText>
          </ThemedView>
        </Pressable>

        <ThemedView style={styles.cardActions}>
          <Pressable
            onPress={() => {
              tapHaptic();
              router.push({ pathname: '/new-post', params: { id: item.id } });
            }}
            hitSlop={8}
            style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Editar aviso"
          >
            <Ionicons name="pencil-outline" size={16} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item)}
            hitSlop={8}
            style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Borrar aviso"
          >
            <Ionicons name="trash-outline" size={16} color={theme.danger} />
          </Pressable>
        </ThemedView>
      </ThemedView>
    );
  }

  function renderAdoptionDog(item: MyAdoptionDog) {
    return (
      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Pressable
          onPress={() => {
            tapHaptic();
            router.push({ pathname: '/adoption/[id]', params: { id: item.id } });
          }}
          style={({ pressed }) => [styles.cardBody, { opacity: pressed ? 0.9 : 1 }]}
        >
          <ThemedView style={styles.photoWrap}>
            <Image source={{ uri: item.photo_urls[0] }} style={styles.photo} contentFit="cover" />
            <ThemedView style={styles.photoBadge}>
              <StatusBadge meta={ADOPTION_STATUS_META[item.status as AdoptionDogStatus]} variant="solid" size="sm" />
            </ThemedView>
          </ThemedView>
          <ThemedView style={styles.cardInfo}>
            <ThemedText type="defaultBold" numberOfLines={1}>
              {item.name || 'Perro en adopción'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.breed ? `${item.breed} · ` : ''}
              {formatRelativeTime(item.created_at)}
            </ThemedText>
          </ThemedView>
        </Pressable>

        <ThemedView style={styles.cardActions}>
          <Pressable
            onPress={() => handleChangeStatus(item)}
            hitSlop={8}
            style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Cambiar estado"
          >
            <Ionicons name="sync-outline" size={16} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() => handleDeleteAdoption(item)}
            hitSlop={8}
            style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Borrar publicación"
          >
            <Ionicons name="trash-outline" size={16} color={theme.danger} />
          </Pressable>
        </ThemedView>
      </ThemedView>
    );
  }

  const sections = [
    ...(myPosts.length > 0 ? [{ title: 'Mis avisos', data: myPosts as (MyDogPost | MyAdoptionDog)[] }] : []),
    ...(isShelter && myAdoptionDogs.length > 0
      ? [{ title: 'Mis perros en adopción', data: myAdoptionDogs as (MyDogPost | MyAdoptionDog)[] }]
      : []),
  ];
  const isLoading = isLoadingPosts || (isShelter && isLoadingAdoption);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Mis avisos</ThemedText>
        </ThemedView>

        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => ('zone_text' in item ? renderPost(item) : renderAdoptionDog(item))}
          renderSectionHeader={({ section }) => (
            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionHeader}>
              {section.title}
            </ThemedText>
          )}
          onRefresh={reload}
          refreshing={isLoading}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !isLoading ? (
              <ThemedView style={styles.empty}>
                <Ionicons name="paw-outline" size={32} color={theme.textSecondary} />
                <ThemedText type="default" style={styles.emptyTitle}>
                  Todavía no publicaste ningún aviso
                </ThemedText>
                <Link href="/new-post" asChild>
                  <Pressable onPress={tapHaptic}>
                    <ThemedText type="small" style={{ color: theme.accent, fontWeight: '600' }}>
                      Publicar el primero
                    </ThemedText>
                  </Pressable>
                </Link>
              </ThemedView>
            ) : null
          }
        />
      </SafeAreaView>

      <BottomTabBar />
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
  listContent: {
    gap: Spacing.three,
    paddingBottom: TAB_BAR_HEIGHT + Spacing.six,
  },
  sectionHeader: {
    textTransform: 'uppercase',
    marginBottom: -Spacing.one,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingRight: Spacing.three,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoWrap: {
    width: 84,
    height: 84,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'transparent',
  },
  resolvedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingVertical: 2,
  },
  resolvedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
    padding: Spacing.three,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
});
