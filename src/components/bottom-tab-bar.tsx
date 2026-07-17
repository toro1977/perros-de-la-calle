import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, usePathname } from 'expo-router';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useScrollActivityStore } from '@/stores/scrollActivityStore';
import { tapHaptic } from '@/utils/haptics';

// Real Liquid Glass (refraction, not just blur) only exists on iOS 26+,
// and even some iOS 26 betas lack the native API — GlassView silently
// degrades to a plain View there with no visual effect at all, so this
// gate is required, not optional. Checked once at module load: the
// result can't change during the app's lifetime.
const useLiquidGlass = isGlassEffectAPIAvailable();

// The bar itself goes back to the app's own light/dark surface — the
// sliding glass pill is what reads as the highlight now, so a forced
// dark bar isn't needed anymore.
const ACTIVE_BG_FALLBACK = 'rgba(120,120,128,0.18)'; // Android / iOS < 26 pill fill

// The sliding pill's base spring — elastic but contained, Tinder-ish.
// Tune from here.
const PILL_SPRING = { damping: 16, stiffness: 180, mass: 1 };
// Squash-and-stretch without scale hacks: the pill's left and right
// edges are two independently-sprung values instead of one x+width
// pair. The edge in the direction of travel (leading) gets a stiffer
// spring and arrives first; the other (trailing) is softer and lags —
// the gap between them IS the stretch, and it closes back to the
// tab's real width once both edges settle.
const LEADING_SPRING = { ...PILL_SPRING, stiffness: PILL_SPRING.stiffness + 40 };
const TRAILING_SPRING = { ...PILL_SPRING, stiffness: PILL_SPRING.stiffness - 40 };

type Tab = {
  path: '/' | '/my-posts' | '/new-post' | '/notifications' | '/profile';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

type TabLayout = { x: number; width: number };

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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isScrolling = useScrollActivityStore(s => s.isScrolling);
  const compact = useSharedValue(0);

  // Real measured geometry per tab, relative to the row that contains
  // both the tabs and the pill — no analytic "5 equal slots" math, so
  // this stays correct even if a label's rendered width changes.
  const [layouts, setLayouts] = useState<Partial<Record<string, TabLayout>>>({});
  const leftEdge = useSharedValue(0);
  const rightEdge = useSharedValue(0);
  const hasPositioned = useRef(false);

  useEffect(() => {
    compact.value = withTiming(isScrolling ? 1 : 0, { duration: 220 });
  }, [isScrolling, compact]);

  // While scrolling, the bar pulls in from the edges a bit — the same
  // "compact" behaviour iOS 26's own tab bars do — then settles back to
  // near-full-width when scrolling stops.
  const compactStyle = useAnimatedStyle(() => ({
    marginHorizontal: Spacing.two + compact.value * Spacing.four,
  }));

  function handleTabLayout(path: string, e: LayoutChangeEvent) {
    const { x, width } = e.nativeEvent.layout;
    setLayouts(prev => {
      const existing = prev[path];
      if (existing && existing.x === x && existing.width === width) return prev;
      return { ...prev, [path]: { x, width } };
    });
  }

  // Re-target the pill whenever the active route changes, or whenever
  // a layout measurement arrives/shifts (first paint, or the bar
  // resizing during the scroll "compact" animation).
  useEffect(() => {
    const active = layouts[pathname];
    if (!active) return;
    const targetLeft = active.x;
    const targetRight = active.x + active.width;

    if (!hasPositioned.current) {
      // First real position — snap instantly instead of springing in
      // from {0,0}. Before this runs, left===right===0 so the pill is
      // zero-width (invisible) rather than needing an opacity fade —
      // opacity on/near a GlassView breaks its glass rendering, so
      // width is the safe way to hide it pre-measurement.
      leftEdge.value = targetLeft;
      rightEdge.value = targetRight;
      hasPositioned.current = true;
      return;
    }

    const movingRight = targetLeft + targetRight > leftEdge.value + rightEdge.value;
    // Leading edge = the one in the direction of travel, reaches first.
    leftEdge.value = withSpring(targetLeft, movingRight ? TRAILING_SPRING : LEADING_SPRING);
    rightEdge.value = withSpring(targetRight, movingRight ? LEADING_SPRING : TRAILING_SPRING);
  }, [pathname, layouts, leftEdge, rightEdge]);

  const pillStyle = useAnimatedStyle(() => ({
    left: leftEdge.value,
    width: Math.max(0, rightEdge.value - leftEdge.value),
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
      <Animated.View style={[styles.bar, { borderColor: theme.border }, compactStyle]}>
        {useLiquidGlass ? (
          <GlassView glassEffectStyle="regular" isInteractive style={StyleSheet.absoluteFill} />
        ) : (
          <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
        )}
        {/* Blur/glass alone is too translucent over busy photos — this
            tint keeps icon/text contrast readable while still letting
            some of the blurred content show through. Not applied to
            the pill (see below): opacity there would break its glass. */}
        <ThemedView style={[styles.barTint, { backgroundColor: theme.surface, opacity: 0.72 }]} />

        {/* Rendered before the tab Pressables so it paints behind their
            icons/labels — no zIndex needed, plain paint order. */}
        <Animated.View pointerEvents="none" style={[styles.pill, pillStyle]}>
          {useLiquidGlass ? (
            <GlassView glassEffectStyle="clear" tintColor={`${theme.accent}22`} style={StyleSheet.absoluteFill} />
          ) : Platform.OS === 'ios' ? (
            <BlurView intensity={40} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: ACTIVE_BG_FALLBACK }]} />
          )}
        </Animated.View>

        {TABS.map(tab => {
          const isActive = pathname === tab.path;
          const color = isActive ? theme.text : theme.textSecondary;
          return (
            <Pressable
              key={tab.path}
              style={styles.tabButton}
              onLayout={e => handleTabLayout(tab.path, e)}
              onPress={() => goTab(tab)}
              accessibilityRole="button"
              accessibilityLabel={tab.path === '/notifications' ? 'Alertas — todavía no disponible' : tab.label}
            >
              <ThemedView style={styles.tabIconWrap}>
                <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={22} color={color} />
                {tab.path === '/notifications' && (
                  // "Alertas" has no backend yet — this dot says "not live",
                  // never a real unread count.
                  <ThemedView style={[styles.soonDot, { backgroundColor: theme.textSecondary, borderColor: theme.surface }]} />
                )}
              </ThemedView>
              <ThemedText
                type="caption"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={{ color, fontWeight: isActive ? '700' : '600' }}
              >
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
  pill: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
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
