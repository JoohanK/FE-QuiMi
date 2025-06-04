import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ContainerComponent from "@/components/ContainerComponent";
import HeaderComponent from "@/components/HeaderComponent";
import BackButton from "@/components/BackButton";

export default function MatchLayout() {
  return (
    <View style={styles.container}>
      <HeaderComponent image={require("../../assets/img/imageMatch.png")} />
      <Slot />
      <View style={styles.bottomBar}>
        <LinearGradient
          colors={["#FFFFE0", "#FFD700"]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  gradient: {
    flex: 1,
  },
});
