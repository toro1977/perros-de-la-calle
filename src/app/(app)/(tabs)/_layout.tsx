import { Tabs } from 'expo-router';

// A real tab navigator, not a Stack — switching between these 4 screens
// must be an instant content swap with no push/pop slide animation
// (Tinder's tab bar never moves, only what's above it changes). The
// built-in tab bar is hidden; BottomTabBar (rendered by each screen)
// is our own UI on top of it.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="my-posts" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
