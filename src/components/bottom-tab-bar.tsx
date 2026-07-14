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
import { useFeedViewStore } from '@/stores/feedViewStore';
import { useScrollActivityStore } from '@/stores/scrollActivityStore';
import { tapHaptic } from '@/utils/haptics';

// Wide floating bar (near-full-width, unlike the narrow pill variant)
// instead of expo-router's <Tabs> — that needs
// @react-navigation/bottom-tabs, which isn't installed, and Mapa isn't
// a real screen (it's a view-mode toggle on "/"), so a stock tab
// navigator wouldn't map cleanly onto these 5 slots anyway. Floats
// above the bottom edge (padding on `wrap`, not `bar`) instead of
// sitting flush against it — flush read as "stuck to the screen" once
// we saw it live.
export function BottomTabBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const viewMode = useFeedViewStore(s => s.viewMode);
  const setViewMode = useFeedViewStore(s => s.setViewMode);
  const isFeedRoute = pathname === '/';
  const isFeedActive = isFeedRoute && viewMode === 'list';
  const isMapaActive = isFeedRoute && viewMode === 'map';
  const isProfile = pathname === '/profile';
  const isNotifications = pathname === '/notifications';
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
    setViewMode('list');
    router.replace('/');
  }

  function goMapa() {
    tapHaptic();
    setViewMode('map');
    router.replace('/');
  }

  function goNotifications() {
    tapHaptic();
    router.replace('/notifications');
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
      <Animated.View style={[styles.bar, { borderColor: theme.border }, compactStyle]}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        <ThemedView style={[styles.barTint, { backgroundColor: theme.surface }]} />

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
            onPress={goMapa}
            accessibilityRole="button"
            accessibilityLabel="Mapa"
          >
            <Ionicons name={isMapaActive ? 'map' : 'map-outline'} size={22} color={isMapaActive ? theme.text : theme.textSecondary} />
            <ThemedText type="caption" style={{ color: isMapaActive ? theme.text : theme.textSecondary }}>
              Mapa
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.tabButton, pressed && { backgroundColor: theme.backgroundElement }]}
            onPress={goPublish}
            accessibilityRole="button"
            accessibilityLabel="Publicar aviso"
          >
            <Ionicons name="add-circle-outline" size={22} color={theme.text} />
            <ThemedText type="caption" style={{ color: theme.text }}>
              Publicar
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.tabButton, pressed && { backgroundColor: theme.backgroundElement }]}
            onPress={goNotifications}
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
          >
            <Ionicons
              name={isNotifications ? 'notifications' : 'notifications-outline'}
              size={22}
              color={isNotifications ? theme.text : theme.textSecondary}
            />
            <ThemedText type="caption" style={{ color: isNotifications ? theme.text : theme.textSecondary }}>
              Avisos
            </ThemedText>
          </Pressable>

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
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
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
  tabButton: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
});
