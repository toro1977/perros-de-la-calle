import { useEffect, useRef } from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { ThemedText } from '@/components/themed-text';
import { DOG_POST_TYPE_META } from '@/constants/dog-post-types';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DogPostListItem } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';

type Props = {
  posts: DogPostListItem[];
  center: { lat: number; lng: number } | null;
};

export function MapPostsView({ posts, center }: Props) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const initialRegion = center
    ? { latitude: center.lat, longitude: center.lng, latitudeDelta: 0.1, longitudeDelta: 0.1 }
    : undefined;

  // initialRegion only applies at mount — if the map renders before
  // getCurrentLocation() resolves (center still null), the map stays
  // stuck on the default region forever unless we re-center here once
  // real coordinates arrive.
  useEffect(() => {
    if (!center) return;
    mapRef.current?.animateToRegion(
      { latitude: center.lat, longitude: center.lng, latitudeDelta: 0.1, longitudeDelta: 0.1 },
      300
    );
  }, [center?.lat, center?.lng]);

  return (
    <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion} showsUserLocation>
      {posts.map(post => {
        const meta = DOG_POST_TYPE_META[post.type as DogPostType];
        return (
          <Marker key={post.id} coordinate={{ latitude: post.lat, longitude: post.lng }} pinColor={theme[meta.tone]}>
            <Callout>
              <Link href={{ pathname: '/post/[id]', params: { id: post.id } }} asChild>
                <Pressable style={StyleSheet.flatten([styles.callout])}>
                  <ThemedText type="smallBold">{meta.label}</ThemedText>
                  <ThemedText type="small">{post.zone_text}</ThemedText>
                </Pressable>
              </Link>
            </Callout>
          </Marker>
        );
      })}
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
