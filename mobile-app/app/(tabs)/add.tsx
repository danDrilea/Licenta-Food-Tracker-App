import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../types/theme';

export default function AddScreen() {
  const theme = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Add Food</Text>
      <Text style={[styles.text, { color: theme.textDim }]}>Scan from photo, scan barcode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
  },
});
