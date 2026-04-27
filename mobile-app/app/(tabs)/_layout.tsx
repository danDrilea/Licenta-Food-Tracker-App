import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View, StyleSheet, Pressable } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#c77ffb',
        tabBarInactiveTintColor: '#888',
        headerStyle: {
          backgroundColor: '#25292e',
        },
        headerShadowVisible: false,
        headerTintColor: '#ffffff',
        tabBarStyle: {
          backgroundColor: '#131517',
          borderTopColor: '#2a2d32',
          height: 85,
          paddingBottom: 25,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.addButtonWrapper}>
              <View style={styles.triangle} />
              <Ionicons name="add" color="#fff" size={28} style={styles.addIcon} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderTopWidth: 75,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#8800ff',
    shadowColor: '#8800ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  addIcon: {
    position: 'absolute',
    top: 6,
  },
});
