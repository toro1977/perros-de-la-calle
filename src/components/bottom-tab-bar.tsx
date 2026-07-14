import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapHaptic } from '@/utils/haptics';

// Manual bottom bar instead of expo-router's <Tabs> — that needs
// @react-navigation/bottom-tabs, which isn't installed, and this app
// only has two real top-level destinations (Feed, Perfil) plus one
// action (Publicar) that isn't a screen you "stay on". A full tab
// navigator would be more machinery than the app needs right now.
export function BottomTabBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isProfile = pathname === '/profile';

  function go(path: '/' | '/profile') {
    tapHaptic();
    router.replace(path);
  }

  function goPublish() {
    tapHaptic();
    router.push('/new-post');
  }

  return (
    <ThemedView style={[styles.wrap, { paddingBottom: insets.bottom + Spacing.two }]} pointerEvents="box-none">
      <ThemedView style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Pressable
          style={styles.tabButton}
          onPress={() => go('/')}
          accessibilityRole="button"
          accessibilityLabel="Feed"
        >
          <Ionicons name={isProfile ? 'home-outline' : 'home'} size={22} color={isProfile ? theme.textSecondary : theme.text} />
          <ThemedText type="caption" style={{ color: isProfile ? theme.textSecondary : theme.text }}>
            Feed
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.publishButton, { backgroundColor: theme.danger }]}
          onPress={goPublish}
          accessibilityRole="button"
          accessibilityLabel="Publicar aviso"
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>

        <Pressable
          style={styles.tabButton}
          onPress={() => go('/profile')}
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
  );
}

export const TAB_BAR_HEIGHT = 64;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: MaxContentWidth,
    marginHorizontal: Spacing.three,
    height: TAB_BAR_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  tabButton: {
    alignItems: 'center',
    gap: 2,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  publishButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
});
