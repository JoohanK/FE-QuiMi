// friend/[id].tsx
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { auth, db } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";

interface Game {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  matchStatus: string;
  createdAt: string;
}

export default function FriendDetail() {
  const { id } = useLocalSearchParams();
  const [friendId, setFriendId] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const currentUserId = auth.currentUser?.uid;

  /* const deleteFriend = async (friendId: string) => {
    try {
      const friendDocRef = doc(db, "friends", friendId);
      await deleteDoc(friendDocRef);
      alert("deleted friend");
    } catch (error) {
      console.error("Error deleting friend:", error);
    }
  }; */

  useEffect(() => {
    if (!id || !currentUserId) return;

    const friendRef = collection(db, "friends");
    const q = query(friendRef, where("__name__", "==", id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const friendUserId =
          data.userId1 === currentUserId ? data.userId2 : data.userId1;
        setFriendId(friendUserId);
      });
    });

    return () => unsubscribe();
  }, [id, currentUserId]);

  useEffect(() => {
    if (!friendId || !currentUserId) return;

    const gamesRef = collection(db, "games");

    // Fråga 1: Jag är player1, vännen är player2
    const q1 = query(
      gamesRef,
      where("player1Id", "==", currentUserId),
      where("player2Id", "==", friendId),
      where("matchStatus", "==", "completed"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    // Fråga 2: Vännen är player1, jag är player2
    const q2 = query(
      gamesRef,
      where("player1Id", "==", friendId),
      where("player2Id", "==", currentUserId),
      where("matchStatus", "==", "completed"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    let gamesFromQ1: Game[] = [];
    let gamesFromQ2: Game[] = [];

    const combineGames = () => {
      const allGames = [...gamesFromQ1, ...gamesFromQ2]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5); // Ta de 5 senaste
      setGames(allGames);
    };

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      gamesFromQ1 = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Game[];
      combineGames();
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      gamesFromQ2 = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Game[];
      combineGames();
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [friendId, currentUserId]);

  const getResult = (game: Game) => {
    const isPlayer1 = game.player1Id === currentUserId;
    const myScore = isPlayer1 ? game.player1Score : game.player2Score;
    const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
    const result =
      myScore > opponentScore
        ? "Victory"
        : myScore === opponentScore
        ? "Draw"
        : "Lose";
    return `${result} (${myScore} - ${opponentScore})`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friend Match History</Text>
      <Text style={styles.subtitle}>Friendship ID: {id}</Text>
      {games.length > 0 ? (
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.gameItem}>
              <Text style={styles.gameResult}>{getResult(item)}</Text>
            </View>
          )}
        />
      ) : (
        <Text>No completed matches found with this friend.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  gameItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  gameResult: {
    fontSize: 18,
  },
});
