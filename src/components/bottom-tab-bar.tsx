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

// Edge-to-edge bar (Instagram/native-iOS style) instead of expo-router's
// <Tabs> — that needs @react-navigation/bottom-tabs, which isn't
// installed, and this app only has two real top-level destinations
// (Feed, Perfil) plus one action (Publicar) that isn't a screen you
// "stay on". A full tab navigator would be more machinery than the app
// needs right now.
export function BottomTabBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isProfile = pathname === '/profile';
  const isScrolling = useScrollActivityStore(s => s.isScrolling);
  const compact = useSharedValue(0);

  useEffect(() => {
    compact.value = withTiming(isScrolling ? 1 : 0, { duration: 220 });
  }, [isScrolling, compact]);

  // While scrolling, the bar pulls in from the edges and rounds off —
  // the same "compact" behaviour iOS 26's own tab bars do — then
  // settles back to full-width when scrolling stops.
  const compactStyle = useAnimatedStyle(() => ({
    marginHorizontal: compact.value * Spacing.four,
    borderRadius: compact.value * Radius.lg,
    borderLeftWidth: compact.value,
    borderRightWidth: compact.value,
  }));

  function go(path: '/' | '/profile') {
    tapHaptic();
    router.replace(path);
  }

  function goPublish() {
    tapHaptic();
    router.push('/new-post');
  }

  return (
    <ThemedView style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={[styles.bar, { borderColor: theme.border, paddingBottom: insets.bottom + Spacing.two }, compactStyle]}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        <ThemedView style={[styles.barTint, { backgroundColor: theme.surface }]} />

        <Pressable
          style={({ pressed }) => [styles.tabButton, pressed && { backgroundColor: theme.backgroundElement }]}
          onPress={() => go('/')}
          accessibilityRole="button"
          accessibilityLabel="Feed"
        >
          <Ionicons name={isProfile ? 'home-outline' : 'home'} size={24} color={isProfile ? theme.textSecondary : theme.text} />
          <ThemedText type="caption" style={{ color: isProfile ? theme.textSecondary : theme.text }}>
            Feed
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.tabButton, pressed && { backgroundColor: theme.backgroundElement }]}
          onPress={goPublish}
          accessibilityRole="button"
          accessibilityLabel="Publicar aviso"
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.text} />
          <ThemedText type="caption" style={{ color: theme.text }}>
            Publicar
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.tabButton, pressed && { backgroundColor: theme.backgroundElement }]}
          onPress={() => go('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Perfil"
        >
          <Ionicons name={isProfile ? 'person' : 'person-outline'} size={24} color={isProfile ? theme.text : theme.textSecondary} />
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
    width: '100%',
    minHeight: TAB_BAR_HEIGHT,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    overflow: 'hidden',
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
