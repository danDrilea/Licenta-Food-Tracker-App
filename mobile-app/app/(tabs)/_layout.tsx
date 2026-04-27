import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Image } from 'react-native';

const MENU_OPTIONS = [
  { icon: 'camera' as const, label: 'Scan Photo' },
  { icon: 'barcode' as const, label: 'Scan Barcode' },
  { icon: 'search' as const, label: 'Search Food' },
];

const triangleImg = require('../../assets/images/cool-triangle.webp');

export default function TabLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
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
            borderTopColor: '#6d28d9',
            borderTopWidth: 0.8,
            height: 85,
            paddingBottom: 25,
            paddingTop: 5,
            shadowColor: '#8800ff',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
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
            tabBarButton: (props) => (
              <Pressable
                style={({ pressed }) => [
                  styles.addTabButton,
                  { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
                ]}
                onPress={() => setMenuOpen(true)}
              >
                <View style={styles.addButtonWrapper}>
                  <Image source={triangleImg} style={styles.triangleImage} />
                  <Ionicons name="add" color="#fff" size={28} style={styles.addIcon} />
                </View>
              </Pressable>
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

      {/* Popup menu overlay */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuContainer} onPress={(e) => e.stopPropagation()}>
            {MENU_OPTIONS.map((option) => (
              <Pressable
                key={option.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={() => {
                  setMenuOpen(false);
                  // TODO: handle each action
                  console.log(option.label);
                }}
              >
                <View style={styles.menuIconCircle}>
                  <Ionicons name={option.icon} color="#fff" size={22} />
                </View>
                <Text style={styles.menuLabel}>{option.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#8800ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addIcon: {
    position: 'absolute',
    top: 6,
  },
  triangleImage: {
    width: 140,
    height: 80,
    resizeMode: 'stretch',
    transform: [{ rotate: '180deg' }],
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 110,
  },

  menuContainer: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    width: 200,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuItemPressed: {
    backgroundColor: '#2a2d32',
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8800ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
