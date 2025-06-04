import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  ScrollView,
  ScrollViewProps,
} from "react-native";

interface ContainerComponentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  scrollProps?: ScrollViewProps;
}

const ContainerComponent: React.FC<ContainerComponentProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 15,
  },
});

export default ContainerComponent;
