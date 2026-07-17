import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* animation: 'none' — reached from the tab bar's "Publicar" item,
          which must feel like switching tabs (instant, bar stays put),
          not like pushing a new screen. */}
      <Stack.Screen name="new-post" options={{ title: 'Publicar aviso', headerShown: false, animation: 'none' }} />
      <Stack.Screen name="post/[id]" options={{ title: 'Detalle del aviso', headerShown: false }} />
      <Stack.Screen name="adoption/[id]" options={{ title: 'Perro en adopción', headerShown: false }} />
    </Stack>
  );
}
