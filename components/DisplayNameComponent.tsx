// DisplayNameComponent.tsx
import React, { useContext } from "react";
import { Text, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";

interface DisplayNameComponentProps {
  fallback?: string;
  style?: any;
  size?: number; // Lägg till size prop
}

const DisplayNameComponent: React.FC<DisplayNameComponentProps> = ({
  fallback = "Anonym användare",
  style,
  size = 16, // Standard textstorlek
}) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Text style={[style, { fontSize: size }]}>{fallback}</Text>;
  }

  return (
    <Text style={[styles.displayName, style, { fontSize: size }]}>
      {user.displayName || fallback}
    </Text>
  );
};

const styles = StyleSheet.create({
  displayName: {
    fontWeight: "bold",
  },
});

export default DisplayNameComponent;
