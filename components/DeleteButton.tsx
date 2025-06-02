import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";

interface DeleteButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

const BackButton: React.FC<DeleteButtonProps> = ({ onPress, style }) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.text}>❌</Text>
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
