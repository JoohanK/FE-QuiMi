import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
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
import { useRouter } from "expo-router";
import { auth, db } from "../firebaseConfig";
import { profileFromId } from "@/utils/profileFromId";
import TitleComponent from "./TitleComponent";
import ContainerComponent from "./ContainerComponent";
import { Friend, FriendWithProfile, Game } from "@/types/types";
import ButtonComponent from "./ButtonComponent";

const FriendList = () => {
  const [friendsWithProfiles, setFriendsWithProfiles] = useState<
    FriendWithProfile[]
  >([]);
  const router = useRouter();
  const [activeGames, setActiveGames] = useState<Game[]>([]);

  const handleFriendPress = (friendId: string) => {
    router.push(`/friend/${friendId}`);
  };

  useEffect(() => {
    const fetchActiveGames = async () => {
      if (!auth.currentUser) return;
      const gamesRef = collection(db, "games");
      const q1 = query(
        gamesRef,
        where("matchStatus", "==", "in progress"),
        where("player1Id", "==", auth.currentUser.uid)
      );
      const q2 = query(
        gamesRef,
        where("matchStatus", "==", "in progress"),
        where("player2Id", "==", auth.currentUser.uid)
      );

      const snapshot1 = await getDocs(q1);
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
    Alert.alert("Challenge friend", `${friend.profile?.displayName}?`, [
      {
        text: "Cancel",
      },
      {
        text: "Challenge",
        onPress: async () => {
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
              Alert.alert(
                "Active Game",
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
              createdAt: new Date().toISOString(),
            };
            const newGameDoc = await addDoc(gamesRef, newGame);

            "Game created with ID:", newGameDoc.id;
            router.push(`/match/${newGameDoc.id}`);
          } catch (error) {
            console.error("Error creating game:", error);
          }
        },
      },
    ]);
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
      {friendsWithProfiles.length > 0 ? (
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
      ) : (
        <Text>No friends to show</Text>
      )}
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    minWidth: "100%",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    alignItems: "center",
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
});

export default FriendList;
