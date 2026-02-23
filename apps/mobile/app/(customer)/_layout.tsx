import { Tabs } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopColor: '#E5E7EB' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tabs.Screen
        name="appointments"
        options={{ title: 'Appointments', tabBarLabel: 'Appointments' }}
      />
    </Tabs>
  );
}
