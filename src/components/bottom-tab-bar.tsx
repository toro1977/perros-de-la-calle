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
import { useScrollActivityStore } from '@/stores/scrollActivityStore';
import { tapHaptic } from '@/utils/haptics';

// Real Liquid Glass (refraction, not just blur) only exists on iOS 26+,
// and even some iOS 26 betas lack the native API — GlassView silently
// degrades to a plain View there with no visual effect at all, so this
// gate is required, not optional. Checked once at module load: the
// result can't change during the app's lifetime.
const useLiquidGlass = isGlassEffectAPIAvailable();

// Tinder-style bar: one continuous dark pill with all 5 destinations
// inline (Publicar included — no separate floating button) and the
// active tab getting its own rounded highlight instead of just a color
// change. Always dark, independent of the app's light/dark theme —
// that's the reference look, and it keeps icon/label contrast
// consistent no matter what's scrolling behind the bar.
const BAR_BORDER = 'rgba(255,255,255,0.08)';
// Tinder's own bar reads as nearly solid black, not a translucent glass
// pane — this tint is deliberately heavy (measured against a recording
// of the real app) so the glass/blur underneath just adds subtle
// texture instead of making the bar look see-through.
const BAR_TINT = 'rgba(12,12,14,0.88)';
const ACTIVE_BG = 'rgba(255,255,255,0.16)';
const ACTIVE_FG = '#FFFFFF';
const INACTIVE_FG = 'rgba(255,255,255,0.85)';

type Tab = {
  path: '/' | '/my-posts' | '/new-post' | '/notifications' | '/profile';
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
const TABS: Tab[] = [
  { path: '/', label: 'Feed', icon: 'home-outline', activeIcon: 'home' },
  { path: '/my-posts', label: 'Mis avisos', icon: 'albums-outline', activeIcon: 'albums' },
  { path: '/new-post', label: 'Publicar', icon: 'add-circle-outline', activeIcon: 'add-circle' },
  { path: '/notifications', label: 'Alertas', icon: 'notifications-outline', activeIcon: 'notifications' },
  { path: '/profile', label: 'Perfil', icon: 'person-outline', activeIcon: 'person' },
];

export function BottomTabBar() {
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
    // Publicar opens a new screen on top of the stack; the other four
    // are peer destinations, so they replace instead of stacking up.
    if (tab.path === '/new-post') router.push('/new-post');
    else router.replace(tab.path);
  }

  return (
    <ThemedView style={[styles.wrap, { paddingBottom: insets.bottom + Spacing.two }]} pointerEvents="box-none">
      <Animated.View style={[styles.bar, { borderColor: BAR_BORDER }, compactStyle]}>
        {useLiquidGlass ? (
          <GlassView glassEffectStyle="regular" isInteractive style={StyleSheet.absoluteFill} />
        ) : (
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <ThemedView style={[styles.barTint, { backgroundColor: BAR_TINT }]} />

        {TABS.map(tab => {
          const isActive = pathname === tab.path;
          return (
            <Pressable
              key={tab.path}
              style={[styles.tabButton, isActive && { backgroundColor: ACTIVE_BG }]}
              onPress={() => goTab(tab)}
              accessibilityRole="button"
              accessibilityLabel={tab.path === '/notifications' ? 'Alertas — todavía no disponible' : tab.label}
            >
              <ThemedView style={styles.tabIconWrap}>
                <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={22} color={isActive ? ACTIVE_FG : INACTIVE_FG} />
                {tab.path === '/notifications' && (
                  // "Alertas" has no backend yet — this dot says "not live",
                  // never a real unread count.
                  <ThemedView style={[styles.soonDot, { backgroundColor: INACTIVE_FG, borderColor: '#000' }]} />
                )}
              </ThemedView>
              <ThemedText type="caption" style={{ color: isActive ? ACTIVE_FG : INACTIVE_FG, fontWeight: isActive ? '700' : '600' }}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
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
    height: TAB_BAR_HEIGHT,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.one,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 48,
    marginHorizontal: 2,
    borderRadius: Radius.full,
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
});
