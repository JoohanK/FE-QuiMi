// components/FriendList.tsx
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { useRouter } from "expo-router";
import { auth, db } from "../firebaseConfig";
import { profileFromId } from "@/utils/profileFromId";
import TitleComponent from "./TitleComponent";
import ContainerComponent from "./ContainerComponent";
import { Friend, FriendWithProfile } from "@/types/types";
import { Alert } from "react-native";
import ButtonComponent from "./ButtonComponent";

const FriendList = () => {
  const [friendsWithProfiles, setFriendsWithProfiles] = useState<
    FriendWithProfile[]
  >([]);
  const router = useRouter();

  const deleteFriend = async (friendId: string) => {
    try {
      const friendDocRef = doc(db, "friends", friendId);
      await deleteDoc(friendDocRef);
      alert("Deleted friend");
    } catch (error) {
      console.error("Error deleting friend:", error);
    }
  };

  const handleFriendPress = (friendId: string) => {
    router.push(`/friend/${friendId}`);
  };

  const handleChallengeFriend = async (friend: FriendWithProfile) => {
    Alert.alert(
      "Challenge friend",
      `${friend.profile?.displayName}?`,
      [
        {
          text: "Challenge",

          onPress: async () => {
            try {
              if (!auth.currentUser) {
                console.error("User not authenticated");
                return;
              }
              const gamesRef = collection(db, "games");

              const friendUserId =
                friend.userId1 === auth.currentUser.uid
                  ? friend.userId2
                  : friend.userId1;

              const newGame = {
                player1Id: auth.currentUser.uid,
                player2Id: friendUserId,
                rounds: [
                  {
                    roundNumber: 1,
                    player1Answers: [],
                    player2Answers: [],
                    categoryId: null,
                  },
                  {
                    roundNumber: 2,
                    player1Answers: [],
                    player2Answers: [],
                    categoryId: null,
                  },
                  {
                    roundNumber: 3,
                    player1Answers: [],
                    player2Answers: [],
                    categoryId: null,
                  },
                  {
                    roundNumber: 4,
                    player1Answers: [],
                    player2Answers: [],
                    categoryId: null,
                  },
                ],
                turn: auth.currentUser.uid,
                player1Score: 0,
                player2Score: 0,
                matchStatus: "in progress",
                createdAt: new Date().toISOString(), // Använd ISO-sträng för konsistens
              };
              const newGameDoc = await addDoc(gamesRef, newGame);

              console.log("Game created with ID:", newGameDoc.id);
              router.push(`/match/${newGameDoc.id}`);
            } catch (error) {
              console.error("Error creating game:", error);
            }
          },
        },
        {
          text: "Cancel",
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    const friendsRef = collection(db, "friends");
    const q1 = query(
      friendsRef,
      where("status", "==", "accepted"),
      where("userId1", "==", auth.currentUser?.uid)
    );
    const q2 = query(
      friendsRef,
      where("status", "==", "accepted"),
      where("userId2", "==", auth.currentUser?.uid)
    );

    let friendsFromQ1: Friend[] = [];
    let friendsFromQ2: Friend[] = [];

    const processFriends = async () => {
      const allFriends = [...friendsFromQ1, ...friendsFromQ2];
      const friendProfilesPromises = allFriends.map(async (friend) => {
        const friendId =
          friend.userId1 === auth.currentUser?.uid
            ? friend.userId2
            : friend.userId1;
        const profile = await profileFromId(friendId);
        return { ...friend, profile };
      });

      const resolvedFriendsWithProfiles = await Promise.all(
        friendProfilesPromises
      );
      setFriendsWithProfiles(resolvedFriendsWithProfiles);
    };

    const processSnapshotQ1 = (querySnapshot: any) => {
      friendsFromQ1 = [];
      querySnapshot.forEach((doc: any) => {
        friendsFromQ1.push({ id: doc.id, ...doc.data() } as Friend);
      });
      processFriends();
    };

    const processSnapshotQ2 = (querySnapshot: any) => {
      friendsFromQ2 = [];
      querySnapshot.forEach((doc: any) => {
        friendsFromQ2.push({ id: doc.id, ...doc.data() } as Friend);
      });
      processFriends();
    };

    const unsubscribe1 = onSnapshot(q1, processSnapshotQ1);
    const unsubscribe2 = onSnapshot(q2, processSnapshotQ2);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  return (
    <ContainerComponent>
      <FlatList
        data={friendsWithProfiles}
        renderItem={({ item }) => (
          <>
            <Pressable
              onPress={() => handleFriendPress(item.id)}
              style={styles.itemContainer}
            >
              <View style={styles.profileContainer}>
                <Text style={styles.profileEmoji}>
                  {item.profile?.photoURL || ""}
                </Text>
                <Text style={styles.profileName}>
                  {item.profile?.displayName || "Loading..."}
                </Text>
              </View>
              <ButtonComponent
                title="Challenge"
                style={{ backgroundColor: "green" }}
                onPress={() => handleChallengeFriend(item)}
              ></ButtonComponent>
            </Pressable>
          </>
        )}
        keyExtractor={(item) => item.id}
      />
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    minWidth: "100%",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileEmoji: {
    fontSize: 30,
    marginRight: 10,
  },
  profileName: {
    fontSize: 20,
  },
});

export default FriendList;
