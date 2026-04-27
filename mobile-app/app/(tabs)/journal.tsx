import { StyleSheet, Text, View } from 'react-native';

export default function JournalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Journal</Text>
      <Text style={styles.text}>Mese: mic dejun, pranz, cina, gustari</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    color: '#aaa',
    fontSize: 14,
  },
});
