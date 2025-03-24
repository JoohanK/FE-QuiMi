import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot, useRouter } from "expo-router";
import ContainerComponent from "@/components/ContainerComponent";
import HeaderComponent from "@/components/HeaderComponent";
import BackButton from "@/components/BackButton";

export default function FriendLayout() {
  const router = useRouter();
  const onPress = () => {
    router.push("/menu/friends");
  };
  return (
    <>
      <HeaderComponent title="Friend"></HeaderComponent>
      <BackButton onPress={onPress}></BackButton>

      <Slot />
    </>
  );
}
