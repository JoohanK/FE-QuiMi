import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface DeleteButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onPress, style }) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Ionicons name="close" size={60} color="#EC6265" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    margin: 8,
    overflow: "hidden",
  },
  gradient: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default DeleteButton;
