import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SQLiteProvider } from 'expo-sqlite';
import { LogBox } from 'react-native';
import { SettingsProvider } from "../contexts/SettingsContext";
import { initDatabase } from "../db/database";

// Ignore warning caused by NestableDraggableFlatList inside NestableScrollContainer
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'VirtualizedList: You have a large list that is slow to update',
  'InteractionManager has been deprecated',
]);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="foodtracker.db" onInit={initDatabase}>
        <SettingsProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
          </Stack>
        </SettingsProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  )
}
