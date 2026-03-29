import { Button } from "@react-navigation/elements";
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  // This state holds the image that comes BACK from the Pi
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    // 1. Pick the image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return; // Stop if they close the gallery

    setLoading(true)
    setImageUri(null);

    // 2. Package the image
    let formData = new FormData();
    formData.append('photo', {
      uri: result.assets[0].uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);

    // 3. Send to Pi
    try {
      let response = await fetch('http://raspberrypi.local:8000/analyze-food', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData,
      });

      let data = await response.json();

      // 4. Display the image returned from the Pi
      if (data.status === "success") {
        setImageUri(`data:image/jpeg;base64,${data.image_base64}`);
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not reach the Pi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Snacks screen</Text>
      <Text style={styles.text}>Did you know eating snacks is kinda cool?</Text>
      
      <Button
        color="#fff"
        style={styles.button}
        onPress={handleUpload}
      > 
        Upload image 
      </Button>

      {loading && <Text style={styles.text}> LOADING... </Text>}

      {imageUri && (
        <Image 
          source={{ uri: imageUri }} 
          style={styles.imageBox} 
        />
      )}
      
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
  text: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#8800ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 10,
  },
  imageBox: {
    width: 300,
    height: 300,
    marginTop: 20,
    borderRadius: 10,
  }
});
