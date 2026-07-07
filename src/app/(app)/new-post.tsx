import { useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { getCurrentLocation } from '@/services/location';
import { pickPhoto } from '@/services/photoPicker';
import { useAuthStore } from '@/stores/authStore';
import { useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';

const TYPE_OPTIONS: { label: string; value: DogPostType }[] = [
  { label: 'Perdido', value: 'lost' },
  { label: 'Encontrado', value: 'found' },
  { label: 'Callejero', value: 'stray' },
];

export default function NewPostScreen() {
  const profile = useAuthStore(s => s.profile);
  const createPost = useDogPostsStore(s => s.createPost);
  const isLoading = useDogPostsStore(s => s.isLoading);

  const [type, setType] = useState<DogPostType>('lost');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [breed, setBreed] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handlePickPhoto() {
    const uri = await pickPhoto();
    if (uri) setPhotoUri(uri);
  }

  async function handleSubmit() {
    if (!profile) return;
    if (!photoUri) {
      setError('Falta una foto del perro.');
      return;
    }
    setError(null);

    const location = await getCurrentLocation();
    if (!location) {
      setError('No pudimos obtener tu ubicación.');
      return;
    }

    try {
      await createPost({
        userId: profile.id,
        type,
        photoUri,
        lat: location.lat,
        lng: location.lng,
        zoneText: location.zoneText,
        eventDate: new Date().toISOString().slice(0, 10),
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
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          Publicar aviso
        </ThemedText>

        <ThemedView style={styles.typeRow}>
          {TYPE_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              style={[styles.typeOption, type === opt.value && styles.typeOptionSelected]}
              onPress={() => setType(opt.value)}
            >
              <ThemedText type="default">{opt.label}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>

        <Pressable style={styles.photoPicker} onPress={handlePickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
          ) : (
            <ThemedText type="default">Elegir foto</ThemedText>
          )}
        </Pressable>

        <TextInput style={styles.input} placeholder="Raza (opcional)" value={breed} onChangeText={setBreed} />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descripción (color, tamaño, dónde exactamente, etc.)"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <ThemedText type="small" themeColor="textSecondary">
          Se va a usar tu ubicación actual para el aviso.
        </ThemedText>

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Pressable
          style={[styles.button, (isLoading || !photoUri) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || !photoUri}
        >
          <ThemedText type="default" style={styles.buttonText}>
            {isLoading ? 'Publicando...' : 'Publicar'}
          </ThemedText>
        </Pressable>
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  typeOptionSelected: {
    borderColor: '#3c87f7',
    borderWidth: 2,
  },
  photoPicker: {
    height: 160,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
  },
  error: {
    color: '#D64545',
  },
});
