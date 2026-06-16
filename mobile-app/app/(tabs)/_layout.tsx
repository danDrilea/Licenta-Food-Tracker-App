import { Tabs, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Image } from 'react-native';
import { useThemeColors } from '../../types/theme';

const MENU_OPTIONS = [
  { icon: 'camera' as const, label: 'Scan Photo' },
  { icon: 'barcode' as const, label: 'Scan Barcode' },
  { icon: 'search' as const, label: 'Search Food' },
  { icon: 'scale-outline' as const, label: 'Log Weight' },
];

const triangleImg = require('../../assets/images/cool-triangle.webp');

export default function TabLayout() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const colors = useThemeColors();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#c77ffb',
          tabBarInactiveTintColor: colors.textDim,
          headerStyle: {
            backgroundColor: colors.headerBg,
          },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 0.8,
            height: 85,
            paddingBottom: 25,
            paddingTop: 5,
            shadowColor: colors.tabBarShadow,
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
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.menuContainer, { backgroundColor: colors.cardBg }]} onPress={(e) => e.stopPropagation()}>
            {MENU_OPTIONS.map((option) => (
              <Pressable
                key={option.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: colors.rowPressed },
                ]}
                onPress={() => {
                  setMenuOpen(false);
                  if (option.label === 'Log Weight') {
                    router.push('/log-weight');
                  } else {
                    console.log(option.label);
                  }
                }}
              >
                <View style={styles.menuIconCircle}>
                  <Ionicons name={option.icon} color="#fff" size={22} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{option.label}</Text>
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
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
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
    top: 4,
  },
  triangleImage: {
    width: 100,
    height: 58,
    resizeMode: 'stretch',
    transform: [{ rotate: '180deg' }],
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 110,
  },

  menuContainer: {
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
    fontSize: 15,
    fontWeight: '600',
  },
});
