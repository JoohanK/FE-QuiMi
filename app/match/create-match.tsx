import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import BackButton from "@/components/BackButton";
import TitleComponent from "@/components/TitleComponent";
import ContainerComponent from "@/components/ContainerComponent";
import ChallengeFriendList from "@/components/ChallengeFriendList";

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
      <View style={{ flex: 1, backgroundColor: "#FFFFE0" }}>
        {mode === "challenge" ? (
          <ContainerComponent>
            <TitleComponent>Challenge friend</TitleComponent>

            <ChallengeFriendList />
          </ContainerComponent>
        ) : (
          <Text>Solo</Text>
        )}
      </View>
    </>
  );
}
