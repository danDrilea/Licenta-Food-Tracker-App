import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#c77ffb',
        headerStyle: {
          backgroundColor: '#25292e',
        },
        headerShadowVisible: false,
        headerTintColor: '#ffffff',
        tabBarStyle: {
          backgroundColor: '#131517'
        }
      }}
    >
      <Tabs.Screen 
        name="index"
        options={{
           title: 'Home', 
           tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
           )
          }}
      />
      <Tabs.Screen 
        name="snacks"
        options={{
          title: 'Snacks', 
          tabBarIcon: ({color,focused}) => (
            <Ionicons name={focused ? 'ice-cream-sharp' : 'ice-cream-outline'} color={color} size={24} />
          )

        }} />
    </Tabs>
  );
}
