import React from "react";
import {
  Text,
  StyleSheet,
  TextProps,
  StyleProp,
  TextStyle,
} from "react-native";

interface TitleComponentProps extends Omit<TextProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>; // Lägg till möjlighet att styla titeln
}

const TitleComponent: React.FC<TitleComponentProps> = ({
  children,
  style,
  ...props
}) => {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default TitleComponent;
