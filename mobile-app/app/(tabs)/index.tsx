import { Button } from "@react-navigation/elements";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [foodEaten,setFoodEaten] = useState(0);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home screen</Text>
      <Text style={styles.text}>PRESS BUTTON TO EAT</Text>
      <Button
      color="#fff"
        style={styles.button}
        onPress={() => setFoodEaten(foodEaten + 1)}
      > Press here to eat food bro!</Button>
      <Text style={styles.text}> FOOD EATEN: {foodEaten} </Text>

      <Button
        color="#fff"
        style={styles.button}
        onPress={() => setFoodEaten(0)}
      > RESET FOOD </Button>
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
