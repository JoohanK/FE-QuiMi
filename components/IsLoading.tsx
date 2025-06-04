import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";

interface IsLoadingProps {
  message?: string;
  size?: "small" | "large";
  color?: string;
}

const IsLoading: React.FC<IsLoadingProps> = ({
  message = "Loading...",
  size = "large",
  color = "#1E90FF",
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    borderRadius: 10,
  },
  message: {
    marginTop: 10,
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
  },
});

export default IsLoading;
