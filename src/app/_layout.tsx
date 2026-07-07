import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Slot, SplashScreen, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

SplashScreen.preventAutoHideAsync();

function NavigationGuard() {
  const session = useAuthStore(s => s.session);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [session, segments]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore(s => s.initialize);
  const isInitialized = useAuthStore(s => s.isInitialized);

  useEffect(() => {
    initialize().finally(() => SplashScreen.hideAsync());
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {isInitialized && <NavigationGuard />}
      <Slot />
    </ThemeProvider>
  );
}
