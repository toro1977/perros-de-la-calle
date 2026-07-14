import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// No backend for this yet (no notifications table, no push wiring) —
// placeholder screen so the tab bar can have its 5th slot now, filled
// in for real once that epic starts.
export default function NotificationsScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Notificaciones</ThemedText>
        </ThemedView>

        <ThemedView style={styles.empty}>
          <Ionicons name="notifications-outline" size={32} color={theme.textSecondary} />
          <ThemedText type="default" style={styles.emptyTitle}>
            Todavía no hay notificaciones
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Pronto te vamos a avisar acá cuando haya novedades sobre tus avisos.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>

      <BottomTabBar />
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
    paddingHorizontal: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    paddingVertical: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
