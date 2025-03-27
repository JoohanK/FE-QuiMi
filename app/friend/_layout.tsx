import React, { useState, useEffect } from "react";

import { Slot, useRouter } from "expo-router";

import HeaderComponent from "@/components/HeaderComponent";
import BackButton from "@/components/BackButton";

export default function FriendLayout() {
  const router = useRouter();

  const onPress = () => {
    router.push("/menu/friends");
  };

  return (
    <>
      <HeaderComponent title="Friend Profile"></HeaderComponent>
      <BackButton onPress={onPress}></BackButton>

      <Slot />
    </>
  );
}
