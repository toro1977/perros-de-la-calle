import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Slot, SplashScreen, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

SplashScreen.preventAutoHideAsync();

const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.accent,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.accent,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

function NavigationGuard() {
  const session = useAuthStore(s => s.session);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    // "p" is the public post landing (src/app/p/[id].tsx) — shared links
    // need to open it for people who aren't logged in at all.
    const inPublicGroup = segments[0] === 'p';

    if (!session && !inAuthGroup && !inPublicGroup) {
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
    <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
      {isInitialized && <NavigationGuard />}
      <Slot />
    </ThemeProvider>
  );
}
