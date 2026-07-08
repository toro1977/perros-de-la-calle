import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentLocation } from '@/services/location';
import { PickedPhoto, pickPhoto } from '@/services/photoPicker';
import { useAuthStore } from '@/stores/authStore';
import { useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';

const TYPE_OPTIONS: { label: string; value: DogPostType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Perdido', value: 'lost', icon: 'help-buoy-outline' },
  { label: 'Encontrado', value: 'found', icon: 'checkmark-circle-outline' },
  { label: 'Callejero', value: 'stray', icon: 'paw-outline' },
];

export default function NewPostScreen() {
  const theme = useTheme();
  const profile = useAuthStore(s => s.profile);
  const createPost = useDogPostsStore(s => s.createPost);
  const isLoading = useDogPostsStore(s => s.isLoading);

  const [type, setType] = useState<DogPostType>('lost');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [breed, setBreed] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handlePickPhoto() {
    const picked = await pickPhoto();
    if (picked) setPhoto(picked);
  }

  async function handleSubmit() {
    if (!profile) return;
    if (!photo) {
      setError('Falta una foto del perro.');
      return;
    }
    setError(null);

    let location;
    try {
      location = await getCurrentLocation();
    } catch {
      setError('No pudimos obtener tu ubicación.');
      return;
    }
    if (!location) {
      setError('No pudimos obtener tu ubicación.');
      return;
    }

    try {
      const now = new Date();
      // Local calendar date, not UTC — toISOString() would push an evening
      // post in Argentina (UTC-3) into the next day.
      const eventDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      await createPost({
        userId: profile.id,
        type,
        photoUri: photo.uri,
        photoMimeType: photo.mimeType,
        lat: location.lat,
        lng: location.lng,
        zoneText: location.zoneText,
        eventDate,
        breed: breed.trim() || null,
        description: description.trim() || null,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el aviso');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
            Tipo de aviso
          </ThemedText>
          <ThemedView style={styles.typeRow}>
            {TYPE_OPTIONS.map(opt => {
              const selected = type === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
                      borderColor: selected ? theme.accent : theme.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setType(opt.value)}
                >
                  <Ionicons name={opt.icon} size={20} color={selected ? theme.accent : theme.textSecondary} />
                  <ThemedText type="small" style={{ color: selected ? theme.accent : theme.text, fontWeight: '600' }}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
            Foto
          </ThemedText>
          <Pressable
            style={[styles.photoPicker, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={handlePickPhoto}
          >
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} contentFit="cover" />
            ) : (
              <ThemedView style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={28} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  Elegir foto
                </ThemedText>
              </ThemedView>
            )}
          </Pressable>

          <TextField label="Raza (opcional)" placeholder="Ej. Mestizo, Labrador..." value={breed} onChangeText={setBreed} />
          <TextField
            label="Descripción"
            placeholder="Color, tamaño, dónde exactamente, etc."
            value={description}
            onChangeText={setDescription}
            multiline
            style={styles.textArea}
          />

          <ThemedView style={[styles.locationHint, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Se va a usar tu ubicación actual para el aviso.
            </ThemedText>
          </ThemedView>

          {error && (
            <ThemedView style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
              <Ionicons name="alert-circle" size={16} color={theme.danger} />
              <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                {error}
              </ThemedText>
            </ThemedView>
          )}

          <Button label="Publicar" onPress={handleSubmit} loading={isLoading} disabled={!photo} />
        </ScrollView>
      </SafeAreaView>
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
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    marginTop: Spacing.one,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  typeOption: {
    flex: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  photoPicker: {
    height: 180,
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  locationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.sm,
    padding: Spacing.two + 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.sm,
  },
});
