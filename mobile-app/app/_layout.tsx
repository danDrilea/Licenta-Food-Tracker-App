import { Stack } from "expo-router";
import { SettingsProvider } from "../contexts/SettingsContext";
import { DailyDataProvider } from "../contexts/DailyDataContext";

export default function RootLayout() {
  return (
    <SettingsProvider>
      <DailyDataProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        </Stack>
      </DailyDataProvider>
    </SettingsProvider>
  )
}
