import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ButtonComponent from "@/components/ButtonComponent";
import ContainerComponent from "@/components/ContainerComponent";
import HeaderComponent from "@/components/HeaderComponent";
import BackButton from "@/components/BackButton";

export default function Match() {
  const { mode } = useLocalSearchParams();
  const router = useRouter();

  const onPress = () => {
    router.push("/menu/play");
  };

  console.log("Match screen");

  return (
    <>
      <BackButton onPress={onPress}></BackButton>

      <Text>Match Screen</Text>
      <Text>Mode: {mode}</Text>
    </>
  );
}
