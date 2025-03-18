import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot, useRouter } from "expo-router";
import ContainerComponent from "@/components/ContainerComponent";
import HeaderComponent from "@/components/HeaderComponent";
import BackButton from "@/components/BackButton";

export default function MatchLayout() {
  return (
    <>
      <HeaderComponent title="Match"></HeaderComponent>

      <Slot />
    </>
  );
}
