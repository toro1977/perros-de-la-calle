import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DogPostListItem } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';

const TYPE_LABELS: Record<DogPostType, string> = {
  lost: 'Perdido',
  found: 'Encontrado',
  stray: 'Callejero',
};

type Props = {
  posts: DogPostListItem[];
  center: { lat: number; lng: number } | null;
};

export function MapPostsView({ posts, center }: Props) {
  const theme = useTheme();
  const pinColors: Record<DogPostType, string> = {
    lost: theme.danger,
    found: theme.success,
    stray: theme.warning,
  };
  const initialRegion = center
    ? { latitude: center.lat, longitude: center.lng, latitudeDelta: 0.1, longitudeDelta: 0.1 }
    : undefined;

  return (
    <MapView style={styles.map} initialRegion={initialRegion} showsUserLocation>
      {posts.map(post => (
        <Marker
          key={post.id}
          coordinate={{ latitude: post.lat, longitude: post.lng }}
          pinColor={pinColors[post.type as DogPostType]}
        >
          <Callout>
            <Link href={{ pathname: '/post/[id]', params: { id: post.id } }} asChild>
              <Pressable style={styles.callout}>
                <ThemedText type="smallBold">{TYPE_LABELS[post.type as DogPostType]}</ThemedText>
                <ThemedText type="small">{post.zone_text}</ThemedText>
              </Pressable>
            </Link>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    borderRadius: Radius.md,
  },
  callout: {
    minWidth: 140,
    gap: 2,
  },
});
