import React, { useState } from "react";
import { Text, View, Pressable, Button } from "react-native";
import Modal from "react-native-modal";
import { useRouter, Redirect } from "expo-router";
import ContainerComponent from "@/components/ContainerComponent";
import ButtonComponent from "@/components/ButtonComponent";
import FlexRowContainer from "@/components/FlexRowContainer";
import TitleComponent from "@/components/TitleComponent";
import { useNavigation, NavigationProp } from "@react-navigation/native";

export default function Play() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  console.log("PLay page loaded");

  const toggleModal = () => {
    console.log("Play button pressed");
    setIsModalVisible(!isModalVisible);
  };

  const handleSolo = () => {
    console.log("Move to Match page");
    router.push("/match/create-match?mode=solo");
    toggleModal();
  };

  const handleChallenge = () => {
    console.log("Move to Match page");
    router.push("/match/create-match?mode=challenge");
    toggleModal();
  };

  return (
    <ContainerComponent>
      <Text>Play page!</Text>
      <ButtonComponent title="Play" onPress={toggleModal}></ButtonComponent>

      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal}>
        <ContainerComponent>
          <TitleComponent>Choose Game Mode</TitleComponent>
          <ButtonComponent title="Solo" onPress={handleSolo}></ButtonComponent>
          <ButtonComponent
            title="Challenge a friend"
            onPress={handleChallenge}
          ></ButtonComponent>
        </ContainerComponent>
      </Modal>
    </ContainerComponent>
  );
}
