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
  { path: '/my-posts', label: 'Mis avisos', icon: 'megaphone-outline', activeIcon: 'megaphone' },
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
      <Ionicons name={name} size={26} color={color} />
    </Animated.View>
  );
}

export function BottomTabBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

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
    const color = isActive ? theme.accent : theme.textSecondary;
    return (
      <Pressable
        key={tab.path}
        style={styles.tabButton}
        onPress={() => goTab(tab)}
        accessibilityRole="button"
        accessibilityLabel={tab.path === '/notifications' ? 'Alertas — todavía no disponible' : tab.label}
      >
        <ThemedView style={styles.tabIconWrap}>
          <TabIcon name={isActive ? tab.activeIcon : tab.icon} isActive={isActive} color={color} />
          {tab.path === '/notifications' && (
            // Real novedades badge — logic/data comes later, this is the
            // dot's final look (accent color, not the old gray "soon" one).
            <ThemedView style={[styles.soonDot, { backgroundColor: theme.accent, borderColor: theme.surface }]} />
          )}
        </ThemedView>
        <ThemedText type="caption" style={{ color, fontWeight: isActive ? '700' : '600' }}>
          {tab.label}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    // Blur/glass covers the whole wrap (not just innerBar) so the entire
    // bottom strip — including the safe-area sliver below the icons —
    // reads as one continuous frosted surface, with no gap where
    // scrolled content could show through un-blurred.
    <ThemedView style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      {useLiquidGlass ? (
        <GlassView glassEffectStyle="clear" style={StyleSheet.absoluteFill} />
      ) : (
        // tint="light", not "default" — "default" follows the OS
        // appearance and reads as a flat gray slab when the phone is in
        // dark mode, even though the app itself is forced light for now.
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
      )}
      {/* Mostly tint, blur only shows through faintly. A sibling of the
          glass view, not a parent, so it doesn't break the glass effect. */}
      <ThemedView style={[styles.barTint, { backgroundColor: theme.surface, opacity: 0.8 }]} />

      <ThemedView style={styles.outerBar}>
        <ThemedView style={[styles.innerBar, { borderTopColor: theme.border }]}>
          <ThemedView style={styles.sideGroup}>{LEFT_TABS.map(renderTab)}</ThemedView>

          <ThemedView style={styles.centerSpacer} />

          <ThemedView style={styles.sideGroup}>{RIGHT_TABS.map(renderTab)}</ThemedView>
        </ThemedView>

        {/* Publicar stays a round elevated button, absolutely positioned
            as a sibling of innerBar — kept elevated above the flush bar
            per explicit request, even though the bar itself no longer
            floats. */}
        <Pressable
          style={({ pressed }) => [styles.publishButton, { backgroundColor: theme.accent }, pressed && styles.publishButtonPressed]}
          onPress={goPublish}
          accessibilityRole="button"
          accessibilityLabel="Publicar aviso"
        >
          <Ionicons name="add" size={28} color={theme.onAccent} />
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

// Intrinsic now (icon + label + vertical padding), not a fixed height —
// this is an approximation other screens use to reserve bottom padding
// so their content doesn't sit under the bar.
export const TAB_BAR_HEIGHT = 54;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  barTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  outerBar: {
    backgroundColor: 'transparent',
  },
  innerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
    paddingTop: 10,
    paddingBottom: 0,
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
