import { Tabs } from 'expo-router';

export default function EmployeeLayout() {
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
        name="appointments"
        options={{ title: 'Appointments', tabBarLabel: 'Appointments' }}
      />
    </Tabs>
  );
}
