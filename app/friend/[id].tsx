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
import { profileFromId } from "@/utils/profileFromId";
import ContainerComponent from "@/components/ContainerComponent";
import TitleComponent from "@/components/TitleComponent";
import FlexRowContainer from "@/components/FlexRowContainer";

interface Game {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  matchStatus: string;
  createdAt: string;
  completedAt?: string; // Nytt valfritt fält för avslutningstid
}

interface GameResult {
  emoji: string;
  resultText: string;
  score: string;
}

export default function FriendDetail() {
  const { id } = useLocalSearchParams();
  const [friendId, setFriendId] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [friendName, setFriendName] = useState<string>("Loading...");
  const [friendPhoto, setFriendPhoto] = useState<string | null>(null);
  const currentUserId = auth.currentUser?.uid;

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
    if (!friendId) return;

    const fetchFriendProfile = async () => {
      const profile = await profileFromId(friendId);
      setFriendName(profile ? profile.displayName : "Unknown");
      setFriendPhoto(profile ? profile.photoURL : null);
    };

    fetchFriendProfile();
  }, [friendId]);

  useEffect(() => {
    if (!friendId || !currentUserId) return;

    const gamesRef = collection(db, "games");

    const q1 = query(
      gamesRef,
      where("player1Id", "==", currentUserId),
      where("player2Id", "==", friendId),
      where("matchStatus", "==", "completed"),
      orderBy("completedAt", "desc"), // Sortera efter completedAt istället för createdAt
      limit(10)
    );

    const q2 = query(
      gamesRef,
      where("player1Id", "==", friendId),
      where("player2Id", "==", currentUserId),
      where("matchStatus", "==", "completed"),
      orderBy("completedAt", "desc"), // Sortera efter completedAt
      limit(10)
    );

    let gamesFromQ1: Game[] = [];
    let gamesFromQ2: Game[] = [];

    const combineGames = () => {
      const allGames = [...gamesFromQ1, ...gamesFromQ2];
      // Sortera efter completedAt i fallande ordning (nyaste först)
      allGames.sort((a, b) => {
        const dateA = new Date(a.completedAt || a.createdAt).getTime(); // Fallback till createdAt om completedAt saknas
        const dateB = new Date(b.completedAt || b.createdAt).getTime();
        return dateB - dateA; // Nyaste matchen först
      });
      // Ta de 10 senaste matcherna
      const recentGames = allGames.slice(0, 10);
      setGames(recentGames);
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

  const getResult = (game: Game): GameResult => {
    const isPlayer1 = game.player1Id === currentUserId;
    const myScore = isPlayer1 ? game.player1Score : game.player2Score;
    const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
    const resultText =
      myScore > opponentScore
        ? "Victory"
        : myScore === opponentScore
        ? "Draw"
        : "Lose";
    const emoji =
      myScore > opponentScore ? "🏆" : myScore === opponentScore ? "🤝" : "😭";
    const score = `(${myScore} - ${opponentScore})`;

    return { emoji, resultText, score };
  };

  return (
    <>
      <FlexRowContainer>
        <Text style={{ fontSize: 70, marginBottom: 20 }}>{friendPhoto}</Text>
        <TitleComponent>{friendName}</TitleComponent>
      </FlexRowContainer>
      <ContainerComponent>
        <TitleComponent>Match History</TitleComponent>

        {games.length > 0 ? (
          <FlatList
            data={games}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const { emoji, resultText, score } = getResult(item);
              return (
                <View style={styles.gameItem}>
                  <View style={styles.resultContainer}>
                    <Text style={styles.gameResultText}>{resultText}</Text>
                    <Text style={styles.gameEmoji}>{emoji}</Text>
                    <Text style={styles.gameScore}>{score}</Text>
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <Text>No completed matches found with this friend.</Text>
        )}
      </ContainerComponent>
    </>
  );
}

const styles = StyleSheet.create({
  gameItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    minWidth: "90%",
  },
  resultContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gameEmoji: {
    fontSize: 30,
    textAlign: "center",
  },
  gameResultText: {
    fontSize: 30,
    textAlign: "left",
  },
  gameScore: {
    fontSize: 30,
    textAlign: "right",
  },
});
