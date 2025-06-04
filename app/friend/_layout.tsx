import React, { useState, useEffect } from "react";
import { Slot, useRouter, useLocalSearchParams } from "expo-router";
import { View, StyleSheet, Alert } from "react-native";
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebaseConfig"; // Ensure auth is imported
import HeaderComponent from "@/components/HeaderComponent";
import BackButton from "@/components/BackButton";
import DeleteButton from "@/components/DeleteButton";
import { LinearGradient } from "expo-linear-gradient";

export default function FriendLayout() {
  const router = useRouter();
  const { id: routeFriendId } = useLocalSearchParams();
  const [friendName, setFriendName] = useState<string | null>(null);

  const friendId = Array.isArray(routeFriendId)
    ? routeFriendId[0]
    : routeFriendId;

  const onPress = () => {
    router.push("/menu/friends");
  };

  const handleDeleteFriend = async () => {
    if (!friendId) {
      Alert.alert("Error", "No friend selected to delete.");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete this friend?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const friendDocRef = doc(db, "friends", friendId);
              await deleteDoc(friendDocRef);
              Alert.alert("Success", "Friend deleted");
              router.push("/menu/friends");
            } catch (error) {
              console.error("Error deleting friend:", error);
              Alert.alert("Error", "Failed to delete friend.");
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: "#FFFFE0" }}>
        <HeaderComponent image={require("../../assets/img/imageFriend.png")} />
        <View style={styles.container}>
          <BackButton onPress={onPress} />
          <DeleteButton onPress={handleDeleteFriend} />
        </View>
        <Slot />
        <View style={styles.bottomBar}>
          <LinearGradient
            colors={["#FFFFE0", "#FFD700"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 10,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  gradient: {
    flex: 1,
  },
});
