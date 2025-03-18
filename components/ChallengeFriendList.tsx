// components/FriendList.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { profileFromId, UserProfile } from "@/utils/profileFromId";
import { useRouter } from "expo-router";
import TitleComponent from "./TitleComponent";
import ContainerComponent from "./ContainerComponent";

interface Friend {
  id: string;
  userId1: string;
  userId2: string;
  status: "accepted";
}

interface FriendWithProfile extends Friend {
  profile: UserProfile | null;
}

const ChallengeFriendList = () => {
  const [friendsWithProfiles, setFriendsWithProfiles] = useState<
    FriendWithProfile[]
  >([]);
  const router = useRouter();

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
      // Ta bort dubbletter baserat på id (om samma vän skulle dyka upp i båda querys)
      /*   const uniqueFriends = resolvedFriendsWithProfiles.filter(
        (friend, index, self) =>
          index === self.findIndex((f) => f.id === friend.id)
      ); */
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

  const handleChallengeFriend = async (friend: FriendWithProfile) => {
    console.log("Friend pressed", friend);
    try {
      if (!auth.currentUser) {
        console.error("User not authenticated");
        return;
      }
      const gamesRef = collection(db, "games");

      const newGame = {
        player1Id: auth.currentUser.uid,
        player2Id: friend.id,
        rounds: [],
        player1Score: 0,
        player2Score: 0,
        matchStatus: "in progress",
        createdAt: new Date(),
      };
      const newGameDoc = await addDoc(gamesRef, newGame);

      console.log("Game created with ID:", newGameDoc.id);
      router.push(`/match/${newGameDoc.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  return (
    <ContainerComponent>
      <FlatList
        data={friendsWithProfiles}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleChallengeFriend(item)}
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
            <Text>VS</Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    minWidth: Dimensions.get("window").width * 0.7,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
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
  profileName: {},
  deleteButton: {
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {},
});

export default ChallengeFriendList;
