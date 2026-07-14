import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BreedAutocomplete } from '@/components/breed-autocomplete';
import { Button } from '@/components/button';
import { LocationPickerModal } from '@/components/location-picker-modal';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DOG_POST_TYPE_META } from '@/constants/dog-post-types';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CurrentLocation, getCurrentLocation } from '@/services/location';
import { PickedPhoto, pickPhotos } from '@/services/photoPicker';
import { useAuthStore } from '@/stores/authStore';
import { useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';
import { scrollFieldIntoView } from '@/utils/scroll-to-input';

const TYPE_OPTIONS: DogPostType[] = ['lost', 'found', 'stray'];
const MAX_PHOTOS = 4;

export default function NewPostScreen() {
  const theme = useTheme();
  const profile = useAuthStore(s => s.profile);
  const createPost = useDogPostsStore(s => s.createPost);
  const isLoading = useDogPostsStore(s => s.isLoading);

  const [type, setType] = useState<DogPostType>('lost');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [breed, setBreed] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const breedRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  useEffect(() => {
    getCurrentLocation()
      .then(setLocation)
      .catch(() => {})
      .finally(() => setIsLocating(false));
  }, []);

  async function handleAddPhotos() {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const picked = await pickPhotos(remaining);
    if (picked.length > 0) setPhotos(prev => [...prev, ...picked].slice(0, MAX_PHOTOS));
  }

  function handleRemovePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!profile) return;
    if (photos.length === 0) {
      setError('Falta al menos una foto del perro.');
      return;
    }
    if (!location) {
      setError('Falta la zona del aviso — elegila en el mapa.');
      return;
    }
    setError(null);

    try {
      const now = new Date();
      // Local calendar date, not UTC — toISOString() would push an evening
      // post in Argentina (UTC-3) into the next day.
      const eventDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      await createPost({
        userId: profile.id,
        type,
        photos,
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
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable style={[styles.backButton, { backgroundColor: theme.backgroundElement }]} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle">Publicar aviso</ThemedText>
          <ThemedView style={styles.backButton} />
        </ThemedView>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
              Tipo de aviso
            </ThemedText>
            <ThemedView style={styles.typeRow}>
              {TYPE_OPTIONS.map(value => {
                const meta = DOG_POST_TYPE_META[value];
                const selected = type === value;
                const toneColor = theme[meta.tone];
                const toneSoft = theme[`${meta.tone}Soft` as const];
                return (
                  <Pressable
                    key={value}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: selected ? toneSoft : theme.backgroundElement,
                        borderColor: selected ? toneColor : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                    onPress={() => setType(value)}
                  >
                    <Ionicons name={meta.icon} size={20} color={selected ? toneColor : theme.textSecondary} />
                    <ThemedText type="small" style={{ color: selected ? toneColor : theme.text, fontWeight: '600' }}>
                      {meta.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>

            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
              Fotos
            </ThemedText>
            {photos.length === 0 ? (
              <Pressable
                style={[styles.photoPicker, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                onPress={handleAddPhotos}
              >
                <ThemedView style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={theme.textSecondary} />
                  <ThemedText type="small" style={styles.photoPlaceholderTitle}>
                    Sacá o elegí una foto
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary" style={styles.photoPlaceholderHint}>
                    Es lo que más ayuda a encontrarlo
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ) : (
              <ThemedView style={styles.photosBlock}>
                <ThemedView style={styles.photoHeroWrap}>
                  <Image source={{ uri: photos[0].uri }} style={styles.photoPreview} contentFit="cover" />
                  <Pressable style={styles.photoRemoveBadge} onPress={() => handleRemovePhoto(0)} hitSlop={8}>
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </Pressable>
                  <ThemedView style={styles.photoCountBadge}>
                    <ThemedText type="caption" style={styles.photoCountText}>
                      {photos.length}/{MAX_PHOTOS}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbRowScroll}
                  contentContainerStyle={styles.thumbRow}
                >
                  {photos.map((p, index) => (
                    <ThemedView key={p.uri} style={styles.thumbWrap}>
                      <Image source={{ uri: p.uri }} style={styles.thumbImage} contentFit="cover" />
                      <Pressable style={styles.thumbRemove} onPress={() => handleRemovePhoto(index)} hitSlop={6}>
                        <Ionicons name="close" size={12} color="#FFFFFF" />
                      </Pressable>
                    </ThemedView>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <Pressable
                      style={[styles.thumbAdd, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                      onPress={handleAddPhotos}
                    >
                      <Ionicons name="add" size={22} color={theme.textSecondary} />
                    </Pressable>
                  )}
                </ScrollView>

                <ThemedText type="caption" themeColor="textSecondary">
                  La primera foto es la que se ve en el feed.
                </ThemedText>
              </ThemedView>
            )}

            <BreedAutocomplete
              ref={breedRef}
              label="Raza (opcional)"
              placeholder="Ej. Mestizo, Callejero, Labrador..."
              value={breed}
              onChangeText={setBreed}
              onFocus={() => scrollFieldIntoView(scrollRef.current, breedRef.current)}
            />
            <TextField
              ref={descriptionRef}
              label="Descripción"
              placeholder="Color, tamaño, dónde exactamente, etc."
              value={description}
              onChangeText={setDescription}
              onFocus={() => scrollFieldIntoView(scrollRef.current, descriptionRef.current)}
              multiline
              style={styles.textArea}
            />

            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
              Zona
            </ThemedText>
            <Pressable
              style={[styles.locationHint, { backgroundColor: theme.backgroundElement }]}
              onPress={() => setShowLocationPicker(true)}
            >
              <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
              {isLocating ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.locationText}>
                  Buscando tu ubicación...
                </ThemedText>
              ) : (
                <ThemedText type="small" numberOfLines={1} style={styles.locationText}>
                  {location?.zoneText ?? 'Elegí la zona en el mapa'}
                </ThemedText>
              )}
              <ThemedText type="linkPrimary">Cambiar</ThemedText>
            </Pressable>

            {error && (
              <ThemedView style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
                <Ionicons name="alert-circle" size={16} color={theme.danger} />
                <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                  {error}
                </ThemedText>
              </ThemedView>
            )}

            <Button label="Publicar" onPress={handleSubmit} loading={isLoading} disabled={photos.length === 0} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <LocationPickerModal
        visible={showLocationPicker}
        initialLocation={location}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={loc => {
          setLocation(loc);
          setShowLocationPicker(false);
        }}
      />
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 240,
    borderWidth: 2,
    borderStyle: 'dashed',
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
    paddingHorizontal: Spacing.four,
  },
  photoPlaceholderTitle: {
    fontWeight: '700',
  },
  photoPlaceholderHint: {
    textAlign: 'center',
  },
  photosBlock: {
    gap: Spacing.two,
  },
  photoHeroWrap: {
    height: 240,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  photoCountText: {
    color: '#FFFFFF',
  },
  thumbRowScroll: {
    flexGrow: 0,
  },
  thumbRow: {
    gap: Spacing.two,
  },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbAdd: {
    width: 72,
    height: 72,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
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
  locationText: {
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.sm,
  },
});
