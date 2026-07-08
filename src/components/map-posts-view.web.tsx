import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DogPostListItem } from '@/stores/dogPostsStore';

type Props = {
  posts: DogPostListItem[];
  center: { lat: number; lng: number } | null;
};

// react-native-maps is native-only. Web keeps this informative instead
// of crashing — see supabase-mcp-cli-gotchas memory for context.
export function MapPostsView({ posts }: Props) {
  const theme = useTheme();
  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <Ionicons name="map-outline" size={28} color={theme.textSecondary} />
      <ThemedText type="default" style={styles.text}>
        El mapa solo está disponible en la app móvil.
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        {posts.length} aviso(s) en esta zona — usá la vista de lista.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.four,
    borderRadius: Radius.md,
  },
  text: {
    textAlign: 'center',
  },
});
