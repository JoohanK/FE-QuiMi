import React from "react";
import { Text } from "react-native";
import ContainerComponent from "@/components/ContainerComponent";
import ButtonComponent from "@/components/ButtonComponent";

const handleAddFriend = () => {};

export default function Friends() {
  return (
    <ContainerComponent>
      <Text>Friends page</Text>
      <ButtonComponent
        title="Add friend"
        onPress={handleAddFriend}
      ></ButtonComponent>
    </ContainerComponent>
  );
}
