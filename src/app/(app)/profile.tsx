import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar, TAB_BAR_HEIGHT } from '@/components/bottom-tab-bar';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { uploadAvatar } from '@/services/avatarUpload';
import { pickAvatarPhoto } from '@/services/photoPicker';
import { useAuthStore } from '@/stores/authStore';
import { MAX_RAW_PHONE_LENGTH, normalizeArPhone } from '@/utils/phone';
import { scrollFieldIntoView } from '@/utils/scroll-to-input';

export default function ProfileScreen() {
  const theme = useTheme();
  const profile = useAuthStore(s => s.profile);
  const signOut = useAuthStore(s => s.signOut);
  const updateProfile = useAuthStore(s => s.updateProfile);
  const updateAvatar = useAuthStore(s => s.updateAvatar);
  const deleteAccount = useAuthStore(s => s.deleteAccount);
  const isLoading = useAuthStore(s => s.isLoading);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone?.replace(/^\+549/, '') ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Borrar cuenta',
      'Se borra tu cuenta y todos tus avisos, para siempre. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar cuenta',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'No se pudo borrar la cuenta');
            }
          },
        },
      ]
    );
  }

  async function handleChangeAvatar() {
    if (!profile) return;
    const photo = await pickAvatarPhoto();
    if (!photo) return;
    setIsUploadingAvatar(true);
    try {
      const avatarUrl = await uploadAvatar(profile.id, photo.uri, photo.mimeType);
      await updateAvatar(avatarUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto de perfil');
    } finally {
      setIsUploadingAvatar(false);
    }
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
            <Pressable
              onPress={handleChangeAvatar}
              disabled={isUploadingAvatar}
              style={styles.avatarWrap}
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
            >
              <ThemedView style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <Ionicons name="person" size={32} color={theme.accent} />
                )}
                {isUploadingAvatar && (
                  <ThemedView style={styles.avatarOverlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </ThemedView>
                )}
              </ThemedView>
              <ThemedView style={[styles.avatarBadge, { backgroundColor: theme.accent, borderColor: theme.background }]}>
                <Ionicons name="camera" size={14} color={theme.onAccent} />
              </ThemedView>
            </Pressable>
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
              maxLength={MAX_RAW_PHONE_LENGTH}
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
              label="Mis avisos"
              variant="ghost"
              onPress={() => router.push('/my-posts')}
              icon={<Ionicons name="albums-outline" size={18} color={theme.text} />}
            />
            <Button
              label="Cerrar sesión"
              variant="ghost"
              onPress={handleSignOut}
              icon={<Ionicons name="log-out-outline" size={18} color={theme.text} />}
            />
            <Button
              label="Borrar cuenta"
              variant="ghost"
              onPress={handleDeleteAccount}
              loading={isLoading}
              icon={<Ionicons name="trash-outline" size={18} color={theme.danger} />}
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
  avatarWrap: {
    alignSelf: 'center',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
