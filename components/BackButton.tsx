import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface BackButtonProps {
  onPress: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>⬅️</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 0,
    margin: 10,
  },
  text: {
    fontSize: 40,
  },
});

export default BackButton;
