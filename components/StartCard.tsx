import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface StartCardProps {
  title: string;
  onPress: () => void;
  subtitle?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const StartCard: React.FC<StartCardProps> = ({
  title,
  onPress,
  subtitle,
  style,
  textStyle,
  disabled,
}) => {
  const subtitleText = subtitle ?? (disabled ? "Waiting..." : "Tap to begin");

  return (
    <TouchableOpacity
      style={[styles.card, style, disabled && styles.disabledCard]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={disabled ? ["#d1d1d1", "#e0e0e0"] : ["#f5f5f5", "#e8e8e8"]}
        style={styles.gradient}
      >
        <Text
          style={[styles.title, textStyle, disabled && styles.disabledText]}
        >
          {title}
        </Text>
        <Text style={[styles.subtitle, disabled && styles.disabledText]}>
          {subtitleText}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: "black",
    overflow: "hidden",
    width: "90%",
    alignSelf: "center",
  },
  gradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  title: {
    color: "#333",
    fontSize: 22,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#666",
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
  },
  disabledCard: {
    opacity: 0.6,
  },
  disabledText: {
    color: "#999",
  },
});

export default StartCard;
