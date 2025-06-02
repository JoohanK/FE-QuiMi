import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

interface CenterContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CenterContainer: React.FC<CenterContainerProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CenterContainer;
