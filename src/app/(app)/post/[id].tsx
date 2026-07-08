import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';
import { DogPostDetail, useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';

const TYPE_META: Record<DogPostType, { label: string; icon: keyof typeof Ionicons.glyphMap; tone: 'danger' | 'success' | 'warning' }> = {
  lost: { label: 'Perdido', icon: 'help-buoy-outline', tone: 'danger' },
  found: { label: 'Encontrado', icon: 'checkmark-circle-outline', tone: 'success' },
  stray: { label: 'Callejero', icon: 'paw-outline', tone: 'warning' },
};

export default function PostDetailScreen() {
  const theme = useTheme();
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
        <SafeAreaView style={styles.centered}>
          <ThemedText type="default" themeColor="textSecondary">
            Cargando...
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const isOwner = profile?.id === post.user_id;
  const meta = TYPE_META[post.type as DogPostType];
  const toneColor = theme[meta.tone];
  const toneSoft = theme[`${meta.tone}Soft` as const];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.photoWrap}>
          <Image source={{ uri: post.photo_url }} style={styles.photo} contentFit="cover" />
          <SafeAreaView edges={['top']} style={styles.photoOverlay}>
            <Pressable style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
          </SafeAreaView>
        </ThemedView>

        <ThemedView style={styles.body}>
          <ThemedView style={[styles.badge, { backgroundColor: toneSoft }]}>
            <Ionicons name={meta.icon} size={14} color={toneColor} />
            <ThemedText type="caption" style={{ color: toneColor }}>
              {meta.label}
            </ThemedText>
          </ThemedView>

          <ThemedText type="title" style={styles.zone}>
            {post.zone_text}
          </ThemedText>

          <ThemedView style={styles.infoList}>
            <ThemedView style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="default">{post.event_date}</ThemedText>
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

          {isOwner && post.status === 'active' && (
            <Button
              label={isResolving ? 'Actualizando...' : 'Marcar como resuelto'}
              onPress={handleResolve}
              loading={isResolving}
              icon={<Ionicons name="checkmark-circle-outline" size={18} color={theme.onAccent} />}
            />
          )}
        </ThemedView>
      </ScrollView>
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
    height: 320,
  },
  photo: {
    width: '100%',
    height: '100%',
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
  body: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  zone: {
    fontSize: 24,
    lineHeight: 30,
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
});
