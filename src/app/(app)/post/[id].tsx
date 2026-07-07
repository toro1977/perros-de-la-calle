import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { DogPostDetail, useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';

const TYPE_LABELS: Record<DogPostType, string> = {
  lost: 'Perdido',
  found: 'Encontrado',
  stray: 'Callejero',
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore(s => s.profile);
  const getPost = useDogPostsStore(s => s.getPost);
  const resolvePost = useDogPostsStore(s => s.resolvePost);
  const [post, setPost] = useState<DogPostDetail | null>(null);
  const [isResolving, setIsResolving] = useState(false);

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

  if (!post) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="default">Cargando...</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const isOwner = profile?.id === post.user_id;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Image source={{ uri: post.photo_url }} style={styles.photo} contentFit="cover" />

        <ThemedText type="linkPrimary">{TYPE_LABELS[post.type as DogPostType]}</ThemedText>
        <ThemedText type="subtitle">{post.zone_text}</ThemedText>
        {post.breed && <ThemedText type="default">Raza: {post.breed}</ThemedText>}
        <ThemedText type="default">Fecha: {post.event_date}</ThemedText>
        {post.description && <ThemedText type="default">{post.description}</ThemedText>}

        {isOwner && post.status === 'active' && (
          <Pressable style={styles.button} onPress={handleResolve} disabled={isResolving}>
            <ThemedText type="default" style={styles.buttonText}>
              {isResolving ? 'Actualizando...' : 'Marcar como resuelto'}
            </ThemedText>
          </Pressable>
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  photo: {
    width: '100%',
    height: 240,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
  },
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  buttonText: {
    color: '#ffffff',
  },
});
