import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";

export default function MatchLayout() {
  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0", // Enkel bakgrundsfärg
  },
});
