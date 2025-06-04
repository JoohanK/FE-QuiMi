import React, { useState } from "react";
import { Text, View } from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

import ContainerComponent from "@/components/ContainerComponent";
import ButtonComponent from "@/components/ButtonComponent";
import InputComponent from "@/components/InputComponent";
import FriendRequests from "@/components/FriendRequests";
import TitleComponent from "@/components/TitleComponent";

export default function AddFriendComponent() {
  const [friendDisplayName, setFriendDisplayName] = useState("");

  const handleAddFriend = async () => {
    "Current user:", auth.currentUser;
    if (!auth.currentUser) {
      alert("You must be logged in to add a friend");
      return;
    }

    try {
      const lowercaseFriendDisplayName = friendDisplayName.toLowerCase();
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("displayNameLowercase", "==", lowercaseFriendDisplayName)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("User not found");
        return;
      }

      const friendDoc = querySnapshot.docs[0];
      const friendId = friendDoc.id;

      "Friend ID:", friendId;

      if (friendId === auth.currentUser.uid) {
        alert("You can't add yourself as a friend");
        return;
      }

      const friendsRef = collection(db, "friends");
      const existingRequestQuery = query(
        friendsRef,
        where("userId1", "in", [auth.currentUser.uid, friendId]),
        where("userId2", "in", [auth.currentUser.uid, friendId])
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      if (!existingRequestSnapshot.empty) {
        alert("Friend request already sent or you are already friends.");
        return;
      }

      const friendRequestData = {
        userId1: auth.currentUser.uid,
        userId2: friendId,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      "Sending friend request with data:", friendRequestData;

      await addDoc(friendsRef, friendRequestData);

      alert("Friend request sent!");
    } catch (error) {
      console.error("Detailed error:", error);
      const errorMessage = (error as Error).message;
      alert(`Error adding friend: ${errorMessage}`);
    }
  };

  return (
    <>
      <ContainerComponent>
        <TitleComponent>Add Friend</TitleComponent>
        <InputComponent
          placeholder="Search username..."
          value={friendDisplayName}
          onChangeText={setFriendDisplayName}
        />
        <ButtonComponent title="Add friend" onPress={handleAddFriend} />
        <FriendRequests />
      </ContainerComponent>
    </>
  );
}
