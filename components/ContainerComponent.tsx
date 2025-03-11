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
  scrollable?: boolean; // Lägg till möjlighet att göra containern scrollbar
  scrollProps?: ScrollViewProps; // Lägg till möjlighet att skicka scrollview props
}

const ContainerComponent: React.FC<ContainerComponentProps> = ({
  children,
  style,
  scrollable,
  scrollProps,
}) => {
  if (scrollable) {
    return (
      <ScrollView
        style={[styles.container, style]}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
});

export default ContainerComponent;
