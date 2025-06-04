import React, { useContext } from "react";
import { Text, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";

interface DisplayNameComponentProps {
  fallback?: string;
  style?: any;
  size?: number;
}

const DisplayNameComponent: React.FC<DisplayNameComponentProps> = ({
  fallback = "Anonymous",
  style,
  size = 16,
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
