import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Perros de la calle', headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Perfil', headerShown: false }} />
      <Stack.Screen name="notifications" options={{ title: 'Notificaciones', headerShown: false }} />
      <Stack.Screen name="my-posts" options={{ title: 'Mis avisos', headerShown: false }} />
      <Stack.Screen name="new-post" options={{ title: 'Publicar aviso', headerShown: false }} />
      <Stack.Screen name="post/[id]" options={{ title: 'Detalle del aviso', headerShown: false }} />
    </Stack>
  );
}
