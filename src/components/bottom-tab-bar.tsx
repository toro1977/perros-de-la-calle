import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useScrollActivityStore } from '@/stores/scrollActivityStore';
import { tapHaptic } from '@/utils/haptics';

const PUBLISH_SIZE = 56;

// Feed · Mis avisos · [Publicar] · Perfil. "Mapa" isn't here anymore —
// it's a view-mode toggle on the feed itself, not a destination (see
// the Lista/Mapa segmented control in src/app/(app)/index.tsx).
// "Notificaciones" isn't here either — it has no backend yet
// (src/app/(app)/notifications.tsx is unlinked, kept for when that
// epic starts; call it "Alertas" then, never "Avisos" — that word is
// already taken by posts, see docs/rediseno-v3.md section A3/A4).
//
// Publicar is a round elevated button (theme.accent), absolutely
// positioned as a sibling of the blurred/clipped bar rather than a
// child of it — a child with a negative marginTop would get clipped
// by the bar's own overflow:hidden (needed to clip the blur/tint to
// its rounded corners).
export function BottomTabBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isFeedActive = pathname === '/';
  const isMyPosts = pathname === '/my-posts';
  const isProfile = pathname === '/profile';
  const isScrolling = useScrollActivityStore(s => s.isScrolling);
  const compact = useSharedValue(0);

  useEffect(() => {
    compact.value = withTiming(isScrolling ? 1 : 0, { duration: 220 });
  }, [isScrolling, compact]);

  // While scrolling, the bar pulls in from the edges a bit — the same
  // "compact" behaviour iOS 26's own tab bars do — then settles back to
  // near-full-width when scrolling stops.
  const compactStyle = useAnimatedStyle(() => ({
    marginHorizontal: Spacing.two + compact.value * Spacing.four,
  }));

  function goFeed() {
    tapHaptic();
    router.replace('/');
  }

  function goMyPosts() {
    tapHaptic();
    router.replace('/my-posts');
  }

  function goProfile() {
    tapHaptic();
    router.replace('/profile');
  }

  function goPublish() {
    tapHaptic();
    router.push('/new-post');
  }

  return (
    <ThemedView style={[styles.wrap, { paddingBottom: insets.bottom + Spacing.two }]} pointerEvents="box-none">
      <Animated.View style={[styles.outerBar, compactStyle]}>
        <ThemedView style={[styles.innerBar, { borderColor: theme.border }]}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <ThemedView style={[styles.barTint, { backgroundColor: theme.surface }]} />

          <ThemedView style={styles.sideGroup}>
            <Pressable
              style={({ pressed }) => [styles.tabButton, pressed && { backgroundColor: theme.backgroundElement }]}
              onPress={goFeed}
              accessibilityRole="button"
              accessibilityLabel="Feed"
            >
              <Ionicons name={isFeedActive ? 'home' : 'home-outline'} size={22} color={isFeedActive ? theme.text : theme.textSecondary} />
              <ThemedText type="caption" style={{ color: isFeedActive ? theme.text : theme.textSecondary }}>
                Feed
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.tabButton, pressed && { backgroundColor: theme.backgroundElement }]}
              onPress={goMyPosts}
              accessibilityRole="button"
              accessibilityLabel="Mis avisos"
            >
              <Ionicons name={isMyPosts ? 'albums' : 'albums-outline'} size={22} color={isMyPosts ? theme.text : theme.textSecondary} />
              <ThemedText type="caption" style={{ color: isMyPosts ? theme.text : theme.textSecondary }}>
                Mis avisos
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.centerSpacer} />

          <ThemedView style={styles.sideGroup}>
            <Pressable
              style={({ pressed }) => [styles.tabButton, pressed && { backgroundColor: theme.backgroundElement }]}
              onPress={goProfile}
              accessibilityRole="button"
              accessibilityLabel="Perfil"
            >
              <Ionicons name={isProfile ? 'person' : 'person-outline'} size={22} color={isProfile ? theme.text : theme.textSecondary} />
              <ThemedText type="caption" style={{ color: isProfile ? theme.text : theme.textSecondary }}>
                Perfil
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <Pressable
          style={({ pressed }) => [styles.publishButton, { backgroundColor: theme.accent }, pressed && styles.publishButtonPressed]}
          onPress={goPublish}
          accessibilityRole="button"
          accessibilityLabel="Publicar aviso"
        >
          <Ionicons name="add" size={28} color={theme.onAccent} />
        </Pressable>
      </Animated.View>
    </ThemedView>
  );
}

export const TAB_BAR_HEIGHT = 64;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  outerBar: {
    backgroundColor: 'transparent',
  },
  innerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TAB_BAR_HEIGHT,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.two,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  // BlurView alone is too translucent over busy photos — this tint
  // sits on top of the blur to keep icon/text contrast readable,
  // still letting some of the blurred content show through.
  barTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.72,
  },
  sideGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerSpacer: {
    width: PUBLISH_SIZE,
    backgroundColor: 'transparent',
  },
  tabButton: {
    alignItems: 'center',
    gap: 2,
    minWidth: 56,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  publishButton: {
    position: 'absolute',
    top: -18,
    left: '50%',
    marginLeft: -PUBLISH_SIZE / 2,
    width: PUBLISH_SIZE,
    height: PUBLISH_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  publishButtonPressed: {
    opacity: 0.85,
  },
});
