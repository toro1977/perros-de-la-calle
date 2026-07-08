import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const signInWithEmail = useAuthStore(s => s.signInWithEmail);
  const isLoading = useAuthStore(s => s.isLoading);

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
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={[theme.accent, '#8E3E14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Ionicons name="paw" size={44} color={theme.onAccent} />
          <ThemedText type="title" style={[styles.appName, { color: theme.onAccent }]}>
            Perros de la calle
          </ThemedText>
          <ThemedText type="default" style={[styles.tagline, { color: theme.onAccent }]}>
            Perdidos, encontrados y en adopción — cerca tuyo
          </ThemedText>
        </LinearGradient>

        <ThemedView style={styles.form}>
          <TextField
            label="Email"
            placeholder="tu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
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

          <Link href="/(auth)/register" asChild>
            <Pressable style={styles.registerLink}>
              <ThemedText type="default" themeColor="textSecondary">
                ¿No tenés cuenta?{' '}
              </ThemedText>
              <ThemedText type="linkPrimary">Registrate</ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
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
