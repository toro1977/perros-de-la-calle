import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { DogPostListItem } from '@/stores/dogPostsStore';

type Props = {
  posts: DogPostListItem[];
  center: { lat: number; lng: number } | null;
};

// react-native-maps is native-only. Web keeps the list view usable
// instead of crashing — see AGENTS.md web caveats for this project.
export function MapPostsView({ posts }: Props) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="default" style={styles.text}>
        El mapa solo está disponible en la app móvil. {posts.length} aviso(s) en esta zona — usá la vista de lista.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  text: {
    textAlign: 'center',
  },
});
