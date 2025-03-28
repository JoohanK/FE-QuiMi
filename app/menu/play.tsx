import React, { useState, useEffect } from "react";
import { Text, View, Pressable, FlatList } from "react-native";
import Modal from "react-native-modal";
import { useRouter } from "expo-router";
import ContainerComponent from "@/components/ContainerComponent";
import ButtonComponent from "@/components/ButtonComponent";
import TitleComponent from "@/components/TitleComponent";
import { auth, db } from "@/firebaseConfig";
import OngoingGamesList from "@/components/OngoingGamesList";

export default function Play() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const router = useRouter();
  const currentUser = auth.currentUser;

  console.log("Play page loaded");

  const toggleModal = () => {
    console.log("Play button pressed");
    setIsModalVisible(!isModalVisible);
  };

  const handleSolo = () => {
    console.log("Move to Match page (Solo)");
    router.push("/match/create-match?mode=solo");
    toggleModal();
  };

  const handleChallenge = () => {
    console.log("Move to Match page (Challenge)");
    router.push("/match/create-match?mode=challenge");
    toggleModal();
  };

  return (
    <>
      <ContainerComponent>
        <TitleComponent>Play</TitleComponent>
        <ButtonComponent title="Start New Game" onPress={toggleModal} />
        <Modal isVisible={isModalVisible} onBackdropPress={toggleModal}>
          <ContainerComponent style={{ justifyContent: "center", gap: 10 }}>
            <ButtonComponent title="Solo" onPress={handleSolo} />
            <ButtonComponent
              title="Challenge a Friend"
              onPress={handleChallenge}
            />
          </ContainerComponent>
        </Modal>
        <OngoingGamesList />
      </ContainerComponent>
    </>
  );
}
