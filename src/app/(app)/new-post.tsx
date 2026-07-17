import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar, TAB_BAR_HEIGHT } from '@/components/bottom-tab-bar';
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
import { useAdoptionDogsStore } from '@/stores/adoptionDogsStore';
import { useAuthStore } from '@/stores/authStore';
import { useDogPostsStore } from '@/stores/dogPostsStore';
import { DogPostType } from '@/types/database.types';
import { scrollFieldIntoView } from '@/utils/scroll-to-input';

type FormType = DogPostType | 'adoption';
const MAX_PHOTOS = 4;

// Not a DogPostType — adoption dogs live in a separate table with no
// location/event date, but the type-selector chip reuses the same
// {label, hint, icon, tone} shape as DOG_POST_TYPE_META entries.
const ADOPTION_TYPE_META = {
  label: 'En adopción',
  hint: 'Perro del refugio buscando familia — sin ubicación, hasta 4 fotos.',
  icon: 'heart-outline' as const,
  tone: 'success' as const,
};

function getTypeMeta(value: FormType) {
  return value === 'adoption' ? ADOPTION_TYPE_META : DOG_POST_TYPE_META[value];
}

// A photo slot is either one already uploaded (editing an existing post)
// or one freshly picked on-device that still needs uploading on submit.
type PhotoSlot = { kind: 'existing'; url: string } | { kind: 'new'; photo: PickedPhoto };

function photoUri(slot: PhotoSlot): string {
  return slot.kind === 'existing' ? slot.url : slot.photo.uri;
}

export default function NewPostScreen() {
  const theme = useTheme();
  const { id, type: typeParam, kind } = useLocalSearchParams<{ id?: string; type?: string; kind?: string }>();
  const isEditMode = !!id;
  const isAdoptionEdit = isEditMode && kind === 'adoption';
  const profile = useAuthStore(s => s.profile);
  const createPost = useDogPostsStore(s => s.createPost);
  const updatePost = useDogPostsStore(s => s.updatePost);
  const getPost = useDogPostsStore(s => s.getPost);
  const isLoadingPost = useDogPostsStore(s => s.isLoading);
  const createAdoptionDog = useAdoptionDogsStore(s => s.createAdoptionDog);
  const updateAdoptionDog = useAdoptionDogsStore(s => s.updateAdoptionDog);
  const getAdoptionDog = useAdoptionDogsStore(s => s.getAdoptionDog);
  const isLoadingAdoption = useAdoptionDogsStore(s => s.isLoading);

  const typeOptions: FormType[] = profile?.role === 'shelter' ? ['lost', 'found', 'stray', 'adoption'] : ['lost', 'found', 'stray'];

  const [type, setType] = useState<FormType>(
    isAdoptionEdit || (typeParam === 'adoption' && profile?.role === 'shelter') ? 'adoption' : 'lost'
  );
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [isLocating, setIsLocating] = useState(!isEditMode);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const nameRef = useRef<TextInput>(null);
  const breedRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const isAdoption = type === 'adoption';
  const isLoading = isAdoption ? isLoadingAdoption : isLoadingPost;

  useEffect(() => {
    // Editing: prefill from the existing post/adoption dog instead of the GPS.
    if (isEditMode && id) {
      if (isAdoptionEdit) {
        getAdoptionDog(id).then(existing => {
          if (!existing) return;
          setPhotos(existing.photo_urls.map(url => ({ kind: 'existing', url })));
          setName(existing.name ?? '');
          setBreed(existing.breed ?? '');
          setDescription(existing.description ?? '');
        });
        return;
      }
      getPost(id).then(existing => {
        if (!existing) return;
        setType(existing.type as DogPostType);
        setPhotos(existing.photo_urls.map(url => ({ kind: 'existing', url })));
        setBreed(existing.breed ?? '');
        setDescription(existing.description ?? '');
        setLocation({ lat: existing.lat, lng: existing.lng, zoneText: existing.zone_text });
      });
      return;
    }
    getCurrentLocation()
      .then(setLocation)
      .catch(() => {})
      .finally(() => setIsLocating(false));
  }, [isEditMode, id, isAdoptionEdit]);

  async function handleAddPhotos() {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const picked = await pickPhotos(remaining);
    if (picked.length > 0) {
      setPhotos(prev => [...prev, ...picked.map((photo): PhotoSlot => ({ kind: 'new', photo }))].slice(0, MAX_PHOTOS));
    }
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
    if (isAdoption) {
      if (!name.trim()) {
        setError('Falta el nombre del perro.');
        return;
      }
    } else if (!location) {
      setError('Falta la zona del aviso — elegila en el mapa.');
      return;
    }
    setError(null);

    try {
      if (type === 'adoption') {
        if (isAdoptionEdit && id) {
          await updateAdoptionDog({
            id,
            userId: profile.id,
            existingPhotoUrls: photos.filter(p => p.kind === 'existing').map(p => p.url),
            newPhotos: photos.filter(p => p.kind === 'new').map(p => p.photo),
            name: name.trim(),
            breed: breed.trim() || null,
            description: description.trim() || null,
          });
        } else {
          await createAdoptionDog({
            photos: photos.filter(p => p.kind === 'new').map(p => p.photo),
            userId: profile.id,
            name: name.trim(),
            breed: breed.trim() || null,
            description: description.trim() || null,
          });
        }
      } else if (!location) {
        return; // unreachable — validated above when type !== 'adoption'
      } else if (isEditMode && id) {
        await updatePost({
          id,
          userId: profile.id,
          type,
          existingPhotoUrls: photos.filter(p => p.kind === 'existing').map(p => p.url),
          newPhotos: photos.filter(p => p.kind === 'new').map(p => p.photo),
          lat: location.lat,
          lng: location.lng,
          zoneText: location.zoneText,
          breed: breed.trim() || null,
          description: description.trim() || null,
        });
      } else {
        const now = new Date();
        // Local calendar date, not UTC — toISOString() would push an evening
        // post in Argentina (UTC-3) into the next day.
        const eventDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        await createPost({
          userId: profile.id,
          type,
          photos: photos.filter(p => p.kind === 'new').map(p => p.photo),
          lat: location.lat,
          lng: location.lng,
          zoneText: location.zoneText,
          eventDate,
          breed: breed.trim() || null,
          description: description.trim() || null,
        });
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el aviso');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable
            style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle">
            {isAdoptionEdit
              ? 'Editar perro en adopción'
              : isEditMode
                ? 'Editar aviso'
                : isAdoption
                  ? 'Publicar en adopción'
                  : 'Publicar aviso'}
          </ThemedText>
          <ThemedView style={styles.backButton} />
        </ThemedView>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!isAdoptionEdit && (
              <>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
                  Tipo de aviso
                </ThemedText>
                <ThemedView style={styles.typeRow}>
                  {typeOptions.map(value => {
                    const meta = getTypeMeta(value);
                    const selected = type === value;
                    const toneColor = theme[meta.tone];
                    const toneSoft = theme[`${meta.tone}Soft` as const];
                    return (
                      <Pressable
                        key={value}
                        style={[
                          styles.typeOption,
                          typeOptions.length > 3 && styles.typeOptionHalf,
                          {
                            backgroundColor: selected ? toneSoft : theme.backgroundElement,
                            borderColor: selected ? toneColor : theme.border,
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
                <ThemedText type="caption" themeColor="textSecondary" style={styles.typeHint}>
                  {getTypeMeta(type).hint}
                </ThemedText>
              </>
            )}

            {isAdoption && (
              <TextField
                ref={nameRef}
                label="Nombre"
                placeholder="Ej. Rocky"
                value={name}
                onChangeText={setName}
                onFocus={() => scrollFieldIntoView(scrollRef.current, nameRef.current)}
              />
            )}

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
                  <Image source={{ uri: photoUri(photos[0]) }} style={styles.photoPreview} contentFit="cover" />
                  <Pressable
                    style={styles.photoRemoveBadge}
                    onPress={() => handleRemovePhoto(0)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Sacar esta foto"
                  >
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
                    <ThemedView key={photoUri(p)} style={styles.thumbWrap}>
                      <Image source={{ uri: photoUri(p) }} style={styles.thumbImage} contentFit="cover" />
                      <Pressable
                        style={styles.thumbRemove}
                        onPress={() => handleRemovePhoto(index)}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="Sacar esta foto"
                      >
                        <Ionicons name="close" size={12} color="#FFFFFF" />
                      </Pressable>
                    </ThemedView>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <Pressable
                      style={[styles.thumbAdd, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                      onPress={handleAddPhotos}
                      accessibilityRole="button"
                      accessibilityLabel="Agregar otra foto"
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
              placeholder="Ej. Mestizo, Labrador..."
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

            {!isAdoption && (
              <>
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
              </>
            )}

            {error && (
              <ThemedView style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
                <Ionicons name="alert-circle" size={16} color={theme.danger} />
                <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                  {error}
                </ThemedText>
              </ThemedView>
            )}
          </ScrollView>

          <ThemedView style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Button
              label={isEditMode ? 'Guardar cambios' : isAdoption ? 'Publicar en adopción' : 'Publicar'}
              onPress={handleSubmit}
              loading={isLoading}
              disabled={photos.length === 0 || (isAdoption && !name.trim())}
            />
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Reached from the tab bar's "Publicar" item — the bar has to stay
          visible here too, not just on the other 4 tab screens. */}
      <BottomTabBar />

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
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    // Clears the floating tab bar, which sits on top of this screen too
    // — safeArea's own bottom inset already covers the home indicator.
    paddingBottom: Spacing.three + TAB_BAR_HEIGHT + Spacing.two,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    marginTop: Spacing.one,
  },
  typeHint: {
    marginTop: -Spacing.two,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  typeOption: {
    flex: 1,
    borderRadius: Radius.sm,
    borderWidth: 2,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  // 4 options (shelter accounts see "En adopción" too) lay out 2x2
  // instead of squeezing into one row.
  typeOptionHalf: {
    flexBasis: '48%',
    flexGrow: 1,
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
