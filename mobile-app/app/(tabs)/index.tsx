import { Button } from "@react-navigation/elements";
import { Text, View, StyleSheet } from "react-native";
import { useState } from "react";

export default function Index() {
  const [foodEaten,setFoodEaten] = useState(0);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home screen</Text>
      <Text style={styles.text}>PRESS BUTTON TO EAT</Text>
      <Button
      color="#fff"
        style={styles.button}
        onPressIn={() => setFoodEaten(foodEaten + 1)}
      > Press here to eat food bro!</Button>
      <Text style={styles.text}> FOOD EATEN: {foodEaten} </Text>

      <Button
        color="#fff"
        style={styles.button}
        onPressIn={() => setFoodEaten(0)}
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
    backgroundColor: '#8800ff', // Tomato red color!
    paddingVertical: 12,        // Space inside top and bottom
    paddingHorizontal: 24,      // Space inside left and right
    borderRadius: 8,            // Rounded corners
    marginVertical: 10,         // Space outside top and bottom (separates the buttons)
  }

});
