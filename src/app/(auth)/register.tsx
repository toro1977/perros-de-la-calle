import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types/database.types';

const ROLES: { value: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'individual', label: 'Persona', icon: 'person-outline' },
  { value: 'shelter', label: 'Refugio / rescatista', icon: 'home-outline' },
];

export default function RegisterScreen() {
  const theme = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('individual');
  const [error, setError] = useState<string | null>(null);
  const signUpWithEmail = useAuthStore(s => s.signUpWithEmail);
  const isLoading = useAuthStore(s => s.isLoading);
  const confirmEmailPending = useAuthStore(s => s.confirmEmailPending);

  async function handleSubmit() {
    setError(null);
    try {
      await signUpWithEmail(email, password, fullName, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
    }
  }

  if (confirmEmailPending) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeAreaCentered}>
          <ThemedView style={[styles.confirmIcon, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="mail-outline" size={32} color={theme.accent} />
          </ThemedView>
          <ThemedText type="subtitle" style={styles.centerText}>
            Confirmá tu email
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
            Te enviamos un link de confirmación a {email}. Abrilo y después volvé a iniciar sesión.
          </ThemedText>
          <Link href="/(auth)/login" asChild>
            <Button label="Ir a iniciar sesión" />
          </Link>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>

        <ThemedText type="title">Crear cuenta</ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          Publicá avisos, sumate como refugio, o adoptá.
        </ThemedText>

        <ThemedView style={styles.form}>
          <TextField label="Nombre completo" placeholder="Tu nombre" value={fullName} onChangeText={setFullName} />
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

          <ThemedText type="caption" themeColor="textSecondary" style={styles.roleLabel}>
            Tipo de cuenta
          </ThemedText>
          <ThemedView style={styles.roleRow}>
            {ROLES.map(opt => {
              const selected = role === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
                      borderColor: selected ? theme.accent : theme.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setRole(opt.value)}
                >
                  <Ionicons name={opt.icon} size={20} color={selected ? theme.accent : theme.textSecondary} />
                  <ThemedText type="small" style={{ color: selected ? theme.accent : theme.text, fontWeight: '600' }}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          {error && (
            <ThemedView style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
              <Ionicons name="alert-circle" size={16} color={theme.danger} />
              <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                {error}
              </ThemedText>
            </ThemedView>
          )}

          <Button label="Crear cuenta" onPress={handleSubmit} loading={isLoading} />

          {/* Link asChild clones this Pressable — keep its style flat, never an
              array (see StyleSheet.flatten note in themed-view.tsx). */}
          <Link href="/(auth)/login" asChild>
            <Pressable style={StyleSheet.flatten([styles.loginLink])}>
              <ThemedText type="default" themeColor="textSecondary">
                ¿Ya tenés cuenta?{' '}
              </ThemedText>
              <ThemedText type="linkPrimary">Ingresá</ThemedText>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  safeAreaCentered: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.four,
  },
  form: {
    gap: Spacing.three,
  },
  roleLabel: {
    textTransform: 'uppercase',
    marginTop: Spacing.one,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  roleOption: {
    flex: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.sm,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
