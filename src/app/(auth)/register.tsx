import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types/database.types';

export default function RegisterScreen() {
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
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Confirmá tu email
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Te enviamos un link de confirmación a {email}. Abrilo y después volvé a iniciar sesión.
          </ThemedText>
          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.button}>
              <ThemedText type="default" style={styles.buttonText}>
                Ir a iniciar sesión
              </ThemedText>
            </Pressable>
          </Link>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Crear cuenta
        </ThemedText>

        <TextInput style={styles.input} placeholder="Nombre completo" value={fullName} onChangeText={setFullName} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <ThemedText type="small">¿Cómo te registrás?</ThemedText>
        <ThemedView style={styles.roleRow}>
          <Pressable
            style={[styles.roleOption, role === 'individual' && styles.roleOptionSelected]}
            onPress={() => setRole('individual')}
          >
            <ThemedText type="default">Persona</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.roleOption, role === 'shelter' && styles.roleOptionSelected]}
            onPress={() => setRole('shelter')}
          >
            <ThemedText type="default">Refugio / rescatista</ThemedText>
          </Pressable>
        </ThemedView>

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Pressable style={styles.button} onPress={handleSubmit} disabled={isLoading}>
          <ThemedText type="default" style={styles.buttonText}>
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </ThemedText>
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable>
            <ThemedText type="linkPrimary">¿Ya tenés cuenta? Ingresá</ThemedText>
          </Pressable>
        </Link>
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  subtitle: {
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: '#3c87f7',
    borderWidth: 2,
  },
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonText: {
    color: '#ffffff',
  },
  error: {
    color: '#D64545',
  },
});
