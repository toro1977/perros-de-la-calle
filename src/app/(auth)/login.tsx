import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';
import { scrollFieldIntoView } from '@/utils/scroll-to-input';

function handleSocialLoginPlaceholder() {
  Alert.alert('Próximamente', 'El login social todavía no está conectado.');
}

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const signInWithEmail = useAuthStore(s => s.signInWithEmail);
  const isLoading = useAuthStore(s => s.isLoading);
  const scrollRef = useRef<ScrollView>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    }
  }

  return (
    <ThemedView style={styles.container}>
      {/* The hero below bleeds under the status bar — dark icons on a
          dark terracotta background are unreadable, so this screen
          needs light content while it's on screen. */}
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <ThemedView style={[styles.hero, { backgroundColor: theme.accent }]}>
              <Ionicons name="paw" size={44} color={theme.onAccent} />
              <ThemedText type="title" style={[styles.appName, { color: theme.onAccent }]}>
                Perros de la calle
              </ThemedText>
              <ThemedText type="default" style={[styles.tagline, { color: theme.onAccent }]}>
                Perdidos, encontrados y en adopción — cerca tuyo
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.form}>
              <Button
                label="Continuar con Google"
                variant="secondary"
                onPress={handleSocialLoginPlaceholder}
                icon={<Ionicons name="logo-google" size={18} color={theme.text} />}
              />
              {Platform.OS === 'ios' && (
                <Button
                  label="Continuar con Apple"
                  variant="secondary"
                  onPress={handleSocialLoginPlaceholder}
                  icon={<Ionicons name="logo-apple" size={20} color={theme.text} />}
                />
              )}

              <ThemedView style={styles.dividerRow}>
                <ThemedView style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <ThemedText type="caption" themeColor="textSecondary">
                  o con tu email
                </ThemedText>
                <ThemedView style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </ThemedView>

              <TextField
                ref={emailRef}
                label="Email"
                placeholder="tu@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => scrollFieldIntoView(scrollRef.current, emailRef.current)}
              />
              <TextField
                ref={passwordRef}
                label="Contraseña"
                placeholder="Tu contraseña"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => scrollFieldIntoView(scrollRef.current, passwordRef.current)}
              />

              {error && (
                <ThemedView style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
                  <Ionicons name="alert-circle" size={16} color={theme.danger} />
                  <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                    {error}
                  </ThemedText>
                </ThemedView>
              )}

              <Button label="Ingresar" onPress={handleSubmit} loading={isLoading} />

              {/* Link asChild clones this Pressable — keep its style flat, never an
                  array (see StyleSheet.flatten note in themed-view.tsx). */}
              <Link href="/(auth)/register" asChild>
                <Pressable style={StyleSheet.flatten([styles.registerLink])}>
                  <ThemedText type="default" themeColor="textSecondary">
                    ¿No tenés cuenta?{' '}
                  </ThemedText>
                  <ThemedText type="linkPrimary">Registrate</ThemedText>
                </Pressable>
              </Link>
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
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  appName: {
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    opacity: 0.92,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.sm,
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
