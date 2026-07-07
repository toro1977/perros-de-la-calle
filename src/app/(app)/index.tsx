import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function HomeScreen() {
  const profile = useAuthStore(s => s.profile);
  const signOut = useAuthStore(s => s.signOut);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          ¡Hola{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </ThemedText>
        <ThemedText type="default">
          {profile?.role === 'shelter' ? 'Cuenta de refugio' : 'Cuenta personal'}
        </ThemedText>
        <ThemedText type="small" style={styles.hint}>
          Acá van a ir los avisos de perdidos, encontrados y en adopción (próxima épica).
        </ThemedText>

        <Pressable style={styles.button} onPress={signOut}>
          <ThemedText type="default" style={styles.buttonText}>
            Cerrar sesión
          </ThemedText>
        </Pressable>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  buttonText: {
    color: '#ffffff',
  },
});
