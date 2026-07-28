import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { Skeleton } from '@/components/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ADOPTION_STATUS_META } from '@/constants/adoption-status';
import { VERIFIED_BADGE_META } from '@/constants/shelter-verification';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AdoptionDogDetail, useAdoptionDogsStore } from '@/stores/adoptionDogsStore';
import { AdoptionDogStatus } from '@/types/database.types';
import { tapHaptic } from '@/utils/haptics';
import { normalizeArPhone } from '@/utils/phone';

// Public, unauthenticated adoption dog page — the landing that a shared
// link opens for people who don't have the app installed. Lives outside
// (app)/(auth) on purpose: src/app/_layout.tsx's NavigationGuard
// special-cases the "pa" segment so it never bounces to /login.
function buildWhatsAppUrl(e164Phone: string, dogName: string | null) {
  const digits = e164Phone.replace(/\D/g, '');
  const message = dogName
    ? `Hola! Vi a ${dogName} en adopción en la app Perros de la calle.`
    : 'Hola! Vi un perro en adopción en la app Perros de la calle.';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function PublicAdoptionDogScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const getAdoptionDog = useAdoptionDogsStore(s => s.getAdoptionDog);
  const [dog, setDog] = useState<AdoptionDogDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'alias' | 'cbu' | null>(null);

  useEffect(() => {
    if (!id) return;
    getAdoptionDog(id).then(result => {
      if (result) setDog(result);
      else setNotFound(true);
    });
  }, [id]);

  async function handleContact() {
    if (!dog) return;
    // Prefer the shelter's dedicated WhatsApp over the account owner's
    // personal phone — see the matching comment in (app)/adoption/[id].tsx.
    const rawPhone = dog.contact_whatsapp || dog.contact_phone;
    const normalizedPhone = rawPhone ? normalizeArPhone(rawPhone) : null;
    if (!normalizedPhone) {
      setContactError('El refugio no dejó un teléfono de contacto válido.');
      return;
    }
    setContactError(null);
    await Linking.openURL(buildWhatsAppUrl(normalizedPhone, dog.name));
  }

  async function handleCopy(field: 'alias' | 'cbu', value: string) {
    tapHaptic();
    await Clipboard.setStringAsync(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function handleOpenApp() {
    if (!id) return;
    Linking.openURL(`perrosdelacalle://adoption/${id}`);
  }

  if (notFound) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.empty}>
            <Ionicons name="paw-outline" size={32} color={theme.textSecondary} />
            <ThemedText type="default" style={styles.emptyTitle}>
              Este perro ya no está disponible
            </ThemedText>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!dog) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.body}>
            <Skeleton style={styles.photo} />
            <Skeleton style={styles.skeletonLine} />
            <Skeleton style={[styles.skeletonLine, styles.skeletonLineNarrow]} />
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.photoWrap}>
            <Image source={{ uri: dog.photo_urls[0] }} style={styles.photo} contentFit="cover" />
          </ThemedView>

          <ThemedView style={styles.infoBlock}>
            <StatusBadge meta={ADOPTION_STATUS_META[dog.status as AdoptionDogStatus]} variant="solid" />
            <ThemedText type="title">{dog.name || 'Perro en adopción'}</ThemedText>
            <ThemedView style={styles.infoRow}>
              <Ionicons name="home-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="default">{dog.shelter_name}</ThemedText>
            </ThemedView>
            {dog.breed && (
              <ThemedView style={styles.infoRow}>
                <Ionicons name="paw-outline" size={18} color={theme.textSecondary} />
                <ThemedText type="default">{dog.breed}</ThemedText>
              </ThemedView>
            )}
            {dog.verification_status === 'approved' && <StatusBadge meta={VERIFIED_BADGE_META} size="sm" />}
          </ThemedView>

          {dog.description && (
            <ThemedView style={[styles.descriptionBox, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="default">{dog.description}</ThemedText>
            </ThemedView>
          )}

          {dog.verification_status === 'approved' &&
            (dog.donation_alias || dog.donation_cbu || dog.donation_mp_link) && (
              <ThemedView style={[styles.donationBox, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="defaultBold">Cómo ayudar</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {dog.shelter_name} solo muestra estos datos acá — la app no procesa pagos.
                </ThemedText>

                {dog.donation_alias && (
                  <Pressable
                    onPress={() => handleCopy('alias', dog.donation_alias!)}
                    style={({ pressed }) => [styles.donationRow, { opacity: pressed ? 0.7 : 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Copiar alias"
                  >
                    <ThemedView style={styles.donationRowText}>
                      <ThemedText type="caption" themeColor="textSecondary">
                        Alias
                      </ThemedText>
                      <ThemedText type="default">{dog.donation_alias}</ThemedText>
                    </ThemedView>
                    <Ionicons
                      name={copiedField === 'alias' ? 'checkmark' : 'copy-outline'}
                      size={18}
                      color={copiedField === 'alias' ? theme.success : theme.accent}
                    />
                  </Pressable>
                )}

                {dog.donation_cbu && (
                  <Pressable
                    onPress={() => handleCopy('cbu', dog.donation_cbu!)}
                    style={({ pressed }) => [styles.donationRow, { opacity: pressed ? 0.7 : 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Copiar CVU o CBU"
                  >
                    <ThemedView style={styles.donationRowText}>
                      <ThemedText type="caption" themeColor="textSecondary">
                        CVU / CBU
                      </ThemedText>
                      <ThemedText type="default">{dog.donation_cbu}</ThemedText>
                    </ThemedView>
                    <Ionicons
                      name={copiedField === 'cbu' ? 'checkmark' : 'copy-outline'}
                      size={18}
                      color={copiedField === 'cbu' ? theme.success : theme.accent}
                    />
                  </Pressable>
                )}

                {dog.donation_mp_link && (
                  <Button
                    label="Donar por MercadoPago"
                    variant="secondary"
                    onPress={() => {
                      tapHaptic();
                      Linking.openURL(dog.donation_mp_link!);
                    }}
                    icon={<Ionicons name="open-outline" size={18} color={theme.text} />}
                  />
                )}
              </ThemedView>
            )}

          {contactError && (
            <ThemedView style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
              <Ionicons name="alert-circle" size={16} color={theme.danger} />
              <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                {contactError}
              </ThemedText>
            </ThemedView>
          )}

          {dog.status === 'available' && (
            <Button
              label="Quiero adoptarlo"
              variant="danger"
              onPress={handleContact}
              icon={<Ionicons name="logo-whatsapp" size={18} color={theme.onAccent} />}
            />
          )}

          {Platform.OS === 'web' && (
            <ThemedView style={[styles.appBanner, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="small" style={{ color: theme.accent, flex: 1 }}>
                Este perro está en adopción en Perros de la calle, la app para reportar y buscar perros.
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.accent, fontWeight: '700' }} onPress={handleOpenApp}>
                Abrir en la app
              </ThemedText>
            </ThemedView>
          )}
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
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  photoWrap: {
    width: '100%',
    height: 280,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  infoBlock: {
    gap: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  descriptionBox: {
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  donationBox: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  donationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  donationRowText: {
    gap: Spacing.half,
    backgroundColor: 'transparent',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.sm,
  },
  appBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  skeletonLine: {
    height: 16,
    borderRadius: Radius.sm,
  },
  skeletonLineNarrow: {
    width: '50%',
  },
});
