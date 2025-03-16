import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ButtonComponent from "@/components/ButtonComponent";

export default function Match() {
  const { mode } = useLocalSearchParams();
  const router = useRouter();

  console.log("Match screen");

  return (
    <View>
      <Text>Match Screen</Text>
      <Text>Mode: {mode}</Text>
      <ButtonComponent
        title="Back to menu"
        onPress={() => router.push("/menu/play")}
      ></ButtonComponent>
    </View>
  );
}
