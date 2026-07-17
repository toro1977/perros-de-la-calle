import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      {/* Both screens get animation: 'none' — going from "Publicar" back
          into the tabs group (tapping any other tab item) pops this
          Stack, and the pop transition follows whichever screen is
          involved, so both sides need it or the trip back still
          slides like a page. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="new-post" options={{ title: 'Publicar aviso', headerShown: false, animation: 'none' }} />
      <Stack.Screen name="post/[id]" options={{ title: 'Detalle del aviso', headerShown: false }} />
      <Stack.Screen name="adoption/[id]" options={{ title: 'Perro en adopción', headerShown: false }} />
    </Stack>
  );
}
