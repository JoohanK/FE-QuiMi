// FlexRowContainer.tsx
import React, { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

interface FlexRowContainerProps {
  children: ReactNode;
  style?: any; // Du kan använda mer specifika typdefinitioner för style om du vill
}

const FlexRowContainer: React.FC<FlexRowContainerProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 20,
  },
});

export default FlexRowContainer;
