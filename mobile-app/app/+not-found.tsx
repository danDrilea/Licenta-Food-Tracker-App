import { View, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useThemeColors } from '../types/theme';

export default function NotFoundScreen() {
  const theme = useThemeColors();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Link href="/" style={[styles.button, { color: theme.textPrimary }]}>
          Go back to Home screen!
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
  },
});
