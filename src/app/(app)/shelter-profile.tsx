import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SHELTER_VERIFICATION_STATUS_META } from '@/constants/shelter-verification';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';
import { useShelterStore } from '@/stores/shelterStore';
import { ShelterVerificationStatus } from '@/types/database.types';
import { MAX_RAW_PHONE_LENGTH, normalizeArPhone } from '@/utils/phone';
import { scrollFieldIntoView } from '@/utils/scroll-to-input';

// icon/tone come from the shared SHELTER_VERIFICATION_STATUS_META (same
// source profile.tsx's menu entry uses) — only this screen's longer
// explanatory copy is specific to it.
const STATUS_BANNER_TEXT: Record<ShelterVerificationStatus, string> = {
  pending: 'Verificación en revisión — te avisamos cuando esté lista.',
  approved: 'Refugio verificado.',
  rejected: 'La solicitud fue rechazada. Revisá los datos y volvé a enviarla.',
};

export default function ShelterProfileScreen() {
  const theme = useTheme();
  const profile = useAuthStore(s => s.profile);
  const shelter = useShelterStore(s => s.shelter);
  const fetchMyShelter = useShelterStore(s => s.fetchMyShelter);
  const requestVerification = useShelterStore(s => s.requestVerification);
  const updateShelterProfile = useShelterStore(s => s.updateShelterProfile);
  const isLoading = useShelterStore(s => s.isLoading);

  const [shelterName, setShelterName] = useState('');
  const [locality, setLocality] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [bio, setBio] = useState('');
  const [donationAlias, setDonationAlias] = useState('');
  const [donationCbu, setDonationCbu] = useState('');
  const [donationMpLink, setDonationMpLink] = useState('');
  // Tracks which shelter row's data is currently reflected in the form
  // fields above, so a prefill only happens once per row (see the render-time
  // adjustment below) instead of on every background refetch after focus.
  const [prefilledShelterId, setPrefilledShelterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const shelterNameRef = useRef<TextInput>(null);
  const localityRef = useRef<TextInput>(null);
  const whatsappRef = useRef<TextInput>(null);
  const socialRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);
  const aliasRef = useRef<TextInput>(null);
  const cbuRef = useRef<TextInput>(null);
  const mpLinkRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      if (profile?.id) fetchMyShelter(profile.id);
    }, [profile, fetchMyShelter])
  );

  // Adjusts state during render instead of in an effect (React's recommended
  // pattern for seeding editable fields from just-loaded data) — prefills
  // once per row so a background refetch after approval doesn't stomp on an
  // in-progress edit.
  if (shelter && shelter.id !== prefilledShelterId) {
    setPrefilledShelterId(shelter.id);
    setShelterName(shelter.shelter_name ?? '');
    setLocality(shelter.locality ?? '');
    setContactWhatsapp(shelter.contact_whatsapp?.replace(/^\+549/, '') ?? '');
    setSocialLinks(shelter.social_links ?? '');
    setBio(shelter.bio ?? '');
    setDonationAlias(shelter.donation_alias ?? '');
    setDonationCbu(shelter.donation_cbu ?? '');
    setDonationMpLink(shelter.donation_mp_link ?? '');
  }

  const status = shelter?.verification_status as ShelterVerificationStatus | undefined;
  const isRequestMode = !shelter || status === 'rejected';
  const showDonationFields = !!shelter;

  async function handleSubmit() {
    if (!profile) return;
    if (!shelterName.trim() || !locality.trim() || !contactWhatsapp.trim() || !socialLinks.trim() || !bio.trim()) {
      setError('Completá todos los campos para enviar la solicitud.');
      return;
    }
    const normalizedPhone = normalizeArPhone(contactWhatsapp);
    if (!normalizedPhone) {
      setError('Ese WhatsApp no parece válido. Escribí el número sin el 0 ni el 15 (ej. 11 2345-6789).');
      return;
    }
    setError(null);
    setSaved(false);
    const coreData = {
      shelterName: shelterName.trim(),
      locality: locality.trim(),
      contactWhatsapp: normalizedPhone,
      socialLinks: socialLinks.trim(),
      bio: bio.trim(),
    };
    try {
      if (isRequestMode) {
        await requestVerification(profile.id, coreData);
      } else {
        await updateShelterProfile(profile.id, {
          ...coreData,
          donationAlias: donationAlias.trim() || null,
          donationCbu: donationCbu.trim() || null,
          donationMpLink: donationMpLink.trim() || null,
        });
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </Pressable>

            <ThemedText type="title">Refugio / rescatista</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              {isRequestMode
                ? 'Verificá tu cuenta para publicar perros en adopción, mostrar el badge de refugio verificado y compartir tus datos de donación.'
                : 'Editá los datos de tu refugio. Los de donación se muestran automáticamente en todos tus avisos de adopción.'}
            </ThemedText>

            {status && (
              <ThemedView
                style={[
                  styles.statusBanner,
                  { backgroundColor: theme[`${SHELTER_VERIFICATION_STATUS_META[status].tone}Soft` as const] },
                ]}
              >
                <Ionicons
                  name={SHELTER_VERIFICATION_STATUS_META[status].icon}
                  size={16}
                  color={theme[SHELTER_VERIFICATION_STATUS_META[status].tone]}
                />
                <ThemedText type="small" style={{ color: theme[SHELTER_VERIFICATION_STATUS_META[status].tone], flex: 1 }}>
                  {STATUS_BANNER_TEXT[status]}
                </ThemedText>
              </ThemedView>
            )}

            <ThemedView style={styles.form}>
              <TextField
                ref={shelterNameRef}
                label="Nombre del refugio o rescatista"
                placeholder="Ej. Huellitas Rescate"
                value={shelterName}
                onChangeText={setShelterName}
                onFocus={() => scrollFieldIntoView(scrollRef.current, shelterNameRef.current)}
              />
              <TextField
                ref={localityRef}
                label="Localidad / zona"
                placeholder="Ej. Morón, Buenos Aires"
                value={locality}
                onChangeText={setLocality}
                onFocus={() => scrollFieldIntoView(scrollRef.current, localityRef.current)}
              />
              <TextField
                ref={whatsappRef}
                label="WhatsApp de contacto"
                prefix="+54 9"
                placeholder="11 2345-6789"
                keyboardType="phone-pad"
                maxLength={MAX_RAW_PHONE_LENGTH}
                value={contactWhatsapp}
                onChangeText={setContactWhatsapp}
                onFocus={() => scrollFieldIntoView(scrollRef.current, whatsappRef.current)}
              />
              <TextField
                ref={socialRef}
                label="Instagram o Facebook"
                placeholder="@tu_refugio"
                autoCapitalize="none"
                value={socialLinks}
                onChangeText={setSocialLinks}
                onFocus={() => scrollFieldIntoView(scrollRef.current, socialRef.current)}
              />
              <TextField
                ref={bioRef}
                label="Contanos qué hacen"
                placeholder="Rescatamos y buscamos hogar para perros de la zona..."
                multiline
                numberOfLines={3}
                style={styles.multiline}
                value={bio}
                onChangeText={setBio}
                onFocus={() => scrollFieldIntoView(scrollRef.current, bioRef.current)}
              />

              {showDonationFields && (
                <>
                  <ThemedText type="caption" themeColor="textSecondary" style={styles.donationLabel}>
                    Datos para donaciones (opcional)
                  </ThemedText>
                  <TextField
                    ref={aliasRef}
                    label="Alias"
                    placeholder="refugio.huellitas"
                    autoCapitalize="none"
                    value={donationAlias}
                    onChangeText={setDonationAlias}
                    onFocus={() => scrollFieldIntoView(scrollRef.current, aliasRef.current)}
                  />
                  <TextField
                    ref={cbuRef}
                    label="CVU / CBU"
                    placeholder="0000003100...."
                    keyboardType="number-pad"
                    value={donationCbu}
                    onChangeText={setDonationCbu}
                    onFocus={() => scrollFieldIntoView(scrollRef.current, cbuRef.current)}
                  />
                  <TextField
                    ref={mpLinkRef}
                    label="Link de MercadoPago"
                    placeholder="https://mpago.la/..."
                    autoCapitalize="none"
                    keyboardType="url"
                    value={donationMpLink}
                    onChangeText={setDonationMpLink}
                    onFocus={() => scrollFieldIntoView(scrollRef.current, mpLinkRef.current)}
                  />
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

              {saved && !error && (
                <ThemedView style={[styles.savedBox, { backgroundColor: theme.successSoft }]}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <ThemedText type="small" style={{ color: theme.success, flex: 1 }}>
                    {isRequestMode ? 'Solicitud enviada.' : 'Datos guardados.'}
                  </ThemedText>
                </ThemedView>
              )}

              <Button
                label={isRequestMode ? 'Solicitar verificación' : 'Guardar cambios'}
                onPress={handleSubmit}
                loading={isLoading}
              />
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.one,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.three,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two + 2,
    borderRadius: Radius.sm,
    marginBottom: Spacing.three,
  },
  form: {
    gap: Spacing.three,
  },
  multiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.two,
  },
  donationLabel: {
    textTransform: 'uppercase',
    marginTop: Spacing.one,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.sm,
  },
  savedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.sm,
  },
});
