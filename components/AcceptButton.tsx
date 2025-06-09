import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AcceptButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  iconSize?: number;
}

const AcceptButton: React.FC<AcceptButtonProps> = ({
  onPress,
  style,
  iconSize = 60,
}) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Ionicons name="checkmark" size={iconSize} color="#4CAF50" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    margin: 8,
    overflow: "hidden",
  },
});

export default AcceptButton;
