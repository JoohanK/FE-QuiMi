import FriendList from "@/components/FriendList";
import React from "react";
import TitleComponent from "@/components/TitleComponent";
import ContainerComponent from "@/components/ContainerComponent";
import { View, StyleSheet, Dimensions } from "react-native";

export default function Friends() {
  return (
    <>
      <View style={{ flex: 1, backgroundColor: "#FFFFE0" }}>
        <ContainerComponent>
          <TitleComponent>Friends</TitleComponent>
          <FriendList />
        </ContainerComponent>
      </View>
    </>
  );
}
