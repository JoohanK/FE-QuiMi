import FriendList from "@/components/FriendList";
import React, { useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import AddFriendComponent from "@/components/AddFriendComponent";

export default function AddFriend() {
  return (
    <>
      <AddFriendComponent />
    </>
  );
}
