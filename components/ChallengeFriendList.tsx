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
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { profileFromId } from "@/utils/profileFromId";
import { useRouter } from "expo-router";
import TitleComponent from "./TitleComponent";
import ContainerComponent from "./ContainerComponent";
import { Friend, FriendWithProfile, Game } from "@/types/types";

const ChallengeFriendList = () => {
  const [friendsWithProfiles, setFriendsWithProfiles] = useState<
    FriendWithProfile[]
  >([]);
  const router = useRouter();
  const [activeGames, setActiveGames] = useState<Game[]>([]);

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

  useEffect(() => {
    const fetchActiveGames = async () => {
      if (!auth.currentUser) return;
      const gamesRef = collection(db, "games");
      const q = query(
        gamesRef,
        where("matchStatus", "==", "in progress"),
        where("player1Id", "==", auth.currentUser.uid)
      );
      const q2 = query(
        gamesRef,
        where("matchStatus", "==", "in progress"),
        where("player2Id", "==", auth.currentUser.uid)
      );

      const snapshot1 = await getDocs(q);
      const snapshot2 = await getDocs(q2);

      const games: Game[] = [];
      snapshot1.forEach((doc) => {
        games.push({ id: doc.id, ...doc.data() } as Game);
      });
      snapshot2.forEach((doc) => {
        games.push({ id: doc.id, ...doc.data() } as Game);
      });
      setActiveGames(games);
    };

    fetchActiveGames();
  }, []);

  const hasActiveGameWith = (friendUserId: string): boolean => {
    return activeGames.some(
      (game) =>
        (game.player1Id === auth.currentUser?.uid &&
          game.player2Id === friendUserId) ||
        (game.player1Id === friendUserId &&
          game.player2Id === auth.currentUser?.uid)
    );
  };

  const handleChallengeFriend = async (friend: FriendWithProfile) => {
    try {
      if (!auth.currentUser) {
        console.error("User not authenticated");
        return;
      }

      const friendUserId =
        friend.userId1 === auth.currentUser.uid
          ? friend.userId2
          : friend.userId1;

      if (hasActiveGameWith(friendUserId)) {
        alert(
          `You already have an active game with ${friend.profile?.displayName}.`
        );
        return;
      }

      const gamesRef = collection(db, "games");

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
    backgroundColor: "white",
    flexDirection: "row",
    minWidth: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 10,
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
    fontSize: 15,
  },
  deleteButton: {
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {},
});

export default ChallengeFriendList;
