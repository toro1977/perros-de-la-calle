import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar, TAB_BAR_HEIGHT } from '@/components/bottom-tab-bar';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';
import { normalizeArPhone } from '@/utils/phone';
import { scrollFieldIntoView } from '@/utils/scroll-to-input';

export default function ProfileScreen() {
  const theme = useTheme();
  const profile = useAuthStore(s => s.profile);
  const signOut = useAuthStore(s => s.signOut);
  const updateProfile = useAuthStore(s => s.updateProfile);
  const isLoading = useAuthStore(s => s.isLoading);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone?.replace(/^\+549/, '') ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
    ]);
  }

  async function handleSave() {
    if (!fullName.trim()) {
      setError('Falta tu nombre.');
      return;
    }
    const normalizedPhone = normalizeArPhone(phone);
    if (!normalizedPhone) {
      setError('Ese teléfono no parece válido. Escribí el número sin el 0 ni el 15 (ej. 11 2345-6789).');
      return;
    }
    setError(null);
    setSaved(false);
    try {
      await updateProfile({ fullName: fullName.trim(), phone: normalizedPhone });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Perfil</ThemedText>
        </ThemedView>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedView style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="person" size={32} color={theme.accent} />
            </ThemedView>
            {!!profile?.email && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.emailText}>
                {profile.email}
              </ThemedText>
            )}

            <TextField
              ref={nameRef}
              label="Nombre completo"
              placeholder="Tu nombre"
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => scrollFieldIntoView(scrollRef.current, nameRef.current)}
            />
            <TextField
              ref={phoneRef}
              label="Teléfono (WhatsApp)"
              prefix="+54 9"
              placeholder="11 2345-6789"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              onFocus={() => scrollFieldIntoView(scrollRef.current, phoneRef.current)}
            />

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
                  Perfil actualizado.
                </ThemedText>
              </ThemedView>
            )}

            <Button label="Guardar cambios" onPress={handleSave} loading={isLoading} />
            <Button
              label="Cerrar sesión"
              variant="ghost"
              onPress={handleSignOut}
              icon={<Ionicons name="log-out-outline" size={18} color={theme.text} />}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <BottomTabBar />
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingBottom: TAB_BAR_HEIGHT + Spacing.six,
    gap: Spacing.three,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  emailText: {
    alignSelf: 'center',
    marginBottom: Spacing.two,
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
