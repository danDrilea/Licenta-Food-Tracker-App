import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SettingsProvider } from "../contexts/SettingsContext";
import { DailyDataProvider } from "../contexts/DailyDataContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <DailyDataProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
          </Stack>
        </DailyDataProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  )
}
