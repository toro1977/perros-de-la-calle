import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, usePathname } from 'expo-router';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
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

// Real Liquid Glass (refraction, not just blur) only exists on iOS 26+,
// and even some iOS 26 betas lack the native API — GlassView silently
// degrades to a plain View there with no visual effect at all, so this
// gate is required, not optional. Checked once at module load: the
// result can't change during the app's lifetime.
const useLiquidGlass = isGlassEffectAPIAvailable();

type Tab = {
  path: '/' | '/my-posts' | '/notifications' | '/profile';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

// "Mapa" isn't here — it's a view-mode toggle on the feed itself, not a
// destination (see the Lista/Mapa segmented control in
// src/app/(app)/index.tsx). "Alertas" (src/app/(app)/notifications.tsx)
// has no backend yet, so it carries a small "soon" dot instead of
// pretending to work — never call it "Avisos", that word is already
// taken by posts (see docs/rediseno-v3.md section A3/A4).
const LEFT_TABS: Tab[] = [
  { path: '/', label: 'Feed', icon: 'home-outline', activeIcon: 'home' },
  { path: '/my-posts', label: 'Mis avisos', icon: 'albums-outline', activeIcon: 'albums' },
];
const RIGHT_TABS: Tab[] = [
  { path: '/notifications', label: 'Alertas', icon: 'notifications-outline', activeIcon: 'notifications' },
  { path: '/profile', label: 'Perfil', icon: 'person-outline', activeIcon: 'person' },
];

// WhatsApp-style active state: no pill, no sliding indicator — just a
// filled icon + strong label color/weight, with a short (non-elastic)
// icon scale bump so the switch reads as a tap, not a hard cut.
function TabIcon({ name, isActive, color }: { name: keyof typeof Ionicons.glyphMap; isActive: boolean; color: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(isActive ? 1.05 : 1, { duration: 120 });
  }, [isActive, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}

export function BottomTabBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
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

  function goTab(tab: Tab) {
    tapHaptic();
    router.replace(tab.path);
  }

  function goPublish() {
    tapHaptic();
    router.push('/new-post');
  }

  function renderTab(tab: Tab) {
    const isActive = pathname === tab.path;
    const color = isActive ? theme.text : theme.textSecondary;
    return (
      <Pressable
        key={tab.path}
        style={({ pressed }) => [styles.tabButton, pressed && { backgroundColor: theme.backgroundElement }]}
        onPress={() => goTab(tab)}
        accessibilityRole="button"
        accessibilityLabel={tab.path === '/notifications' ? 'Alertas — todavía no disponible' : tab.label}
      >
        <ThemedView style={styles.tabIconWrap}>
          <TabIcon name={isActive ? tab.activeIcon : tab.icon} isActive={isActive} color={color} />
          {tab.path === '/notifications' && (
            // "Alertas" has no backend yet — this dot says "not live",
            // never a real unread count.
            <ThemedView style={[styles.soonDot, { backgroundColor: theme.textSecondary, borderColor: theme.surface }]} />
          )}
        </ThemedView>
        <ThemedText type="caption" style={{ color, fontWeight: isActive ? '700' : '600' }}>
          {tab.label}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <ThemedView style={[styles.wrap, { paddingBottom: insets.bottom + Spacing.two }]} pointerEvents="box-none">
      <Animated.View style={[styles.outerBar, compactStyle]}>
        <ThemedView style={[styles.innerBar, { borderColor: theme.border }]}>
          {useLiquidGlass ? (
            <GlassView glassEffectStyle="regular" isInteractive style={StyleSheet.absoluteFill} />
          ) : (
            <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
          )}
          {/* Blur/glass alone is too translucent over busy photos — this
              tint keeps icon/text contrast readable while still letting
              some of the blurred content show through. */}
          <ThemedView style={[styles.barTint, { backgroundColor: theme.surface, opacity: 0.72 }]} />

          <ThemedView style={styles.sideGroup}>{LEFT_TABS.map(renderTab)}</ThemedView>

          <ThemedView style={styles.centerSpacer} />

          <ThemedView style={styles.sideGroup}>{RIGHT_TABS.map(renderTab)}</ThemedView>
        </ThemedView>

        {/* Publicar is a round elevated button, absolutely positioned as
            a sibling of the blurred/clipped bar rather than a child of
            it — a child with a negative marginTop would get clipped by
            the bar's own overflow:hidden (needed to clip the blur/tint
            to its rounded corners). */}
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
  barTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  tabIconWrap: {
    backgroundColor: 'transparent',
  },
  soonDot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
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
