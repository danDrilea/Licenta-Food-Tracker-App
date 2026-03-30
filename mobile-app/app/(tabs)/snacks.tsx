import { Button } from "@react-navigation/elements";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View, ScrollView } from 'react-native';

export default function AboutScreen() {
  // This state holds the image that comes BACK from the Pi
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    // 1. Pick the image
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (pickerResult.canceled) return; // Stop if they close the gallery

    setLoading(true)
    setPredictions([]);
    setImageUri(null);

    // 2. Resize the image to 640px width
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        pickerResult.assets[0].uri,
        [{ resize: { width: 640 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 3. Package the image
      let formData = new FormData();
      formData.append('photo', {
        uri: manipResult.uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      // 4. Send to Pi
      let response = await fetch('http://danal.local:8000/analyze-food', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData,
      });

      let data = await response.json();

      // 5. Display the image returned from the Pi
      if (data.status === "success") {
        setImageUri(`data:image/jpeg;base64,${data.annotated_image}`);
        setPredictions(data.predictions);
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not reach the Pi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Snacks screen</Text>
      <Text style={styles.text}>Did you know eating snacks is kinda cool?</Text>

      <Button
        color="#fff"
        style={styles.button}
        onPress={handleUpload}
      >
        {loading ? "Analyzing..." : "Pick a Snack"}
      </Button>

      {imageUri && (
        <View style={styles.resultContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.imageBox}
          />

          <View style={styles.statsBox}>
            <Text style={styles.statsTitle}>Identified Items:</Text>
            {predictions.length > 0 ? (
              predictions.map((p, i) => (
                <Text key={i} style={styles.predictionText}>
                  • {p.food_item} ({Math.round(p.confidence * 100)}%)
                </Text>
              ))
            ) : (
              <Text style={styles.predictionText}>No food detected.</Text>
            )}
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  text: {
    color: '#fff',
    marginBottom: 10
  },
  button: {
    backgroundColor: '#8800ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 10,
  },
  resultContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  imageBox: {
    width: 320,
    height: 320,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#8800ff',
  },
  statsBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#1a1d21',
    borderRadius: 10,
    width: 320,
  },
  statsTitle: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  predictionText: {
    color: '#fff',
    fontSize: 18,
    marginVertical: 2,
  }
});
