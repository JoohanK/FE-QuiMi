import React, { useState, useEffect } from "react";
import { Text, View, Pressable, FlatList } from "react-native";
import Modal from "react-native-modal";
import { useRouter } from "expo-router";
import ContainerComponent from "@/components/ContainerComponent";
import ButtonComponent from "@/components/ButtonComponent";
import TitleComponent from "@/components/TitleComponent";
import { auth, db } from "@/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { profileFromId } from "@/utils/profileFromId";
import { Game } from "@/types/types";

export default function OngoingGamesList() {
  const [ongoingGames, setOngoingGames] = useState<Game[]>([]);
  const router = useRouter();
  const currentUser = auth.currentUser;

  console.log("Play page loaded");

  useEffect(() => {
    if (!currentUser) return;

    const gamesRef = collection(db, "games");
    const q1 = query(
      gamesRef,
      where("player1Id", "==", currentUser.uid),
      where("matchStatus", "==", "in progress")
    );
    const q2 = query(
      gamesRef,
      where("player2Id", "==", currentUser.uid),
      where("matchStatus", "==", "in progress")
    );

    let allGames: Game[] = [];

    const fetchOpponentNames = async (games: Game[]) => {
      const updatedGames = await Promise.all(
        games.map(async (game) => {
          const opponentId =
            game.player1Id === currentUser.uid
              ? game.player2Id
              : game.player1Id;
          const profile = await profileFromId(opponentId);
          return {
            ...game,
            photoURL: profile?.photoURL,
            opponentName: profile?.displayName || "Unknown",
          };
        })
      );

      return updatedGames;
    };

    const updateGamesList = (newGames: Game[]) => {
      // Kombinera nya spel med befintliga, ta bort dubbletter baserat på id
      const combinedGames = [
        ...allGames.filter((g) => !newGames.some((ng) => ng.id === g.id)),
        ...newGames,
      ];
      const sortedGames = combinedGames.sort((a, b) => {
        const aIsMyTurn = a.turn === currentUser.uid ? 0 : 1;
        const bIsMyTurn = b.turn === currentUser.uid ? 0 : 1;
        return aIsMyTurn - bIsMyTurn;
      });
      allGames = combinedGames; // Uppdatera allGames för nästa körning
      setOngoingGames(sortedGames);
    };

    const unsubscribe1 = onSnapshot(q1, async (snapshot) => {
      const games = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Game[];
      const updatedGames = await fetchOpponentNames(games);
      updateGamesList(updatedGames);
    });

    const unsubscribe2 = onSnapshot(q2, async (snapshot) => {
      const games = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Game[];
      const updatedGames = await fetchOpponentNames(games);
      updateGamesList(updatedGames);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser?.uid]);

  const handleResumeGame = (gameId: string) => {
    console.log("Resuming game with ID:", gameId);
    router.push(`/match/${gameId}`);
  };

  return (
    <>
      <ContainerComponent>
        <TitleComponent>Ongoing Games</TitleComponent>
        {ongoingGames.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <FlatList
              data={ongoingGames}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleResumeGame(item.id)}
                  style={{
                    minWidth: "100%",
                    backgroundColor: "white",
                    padding: 20,
                    borderWidth: 2,
                    borderColor:
                      item.turn === currentUser?.uid ? "green" : "orange",
                    borderRadius: 5,
                    marginVertical: 5,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ flex: 1, fontSize: 16 }}>
                    <Text style={{ fontWeight: "bold" }}>VS</Text>{" "}
                    {item.photoURL ? item.photoURL : "👤"} {item.opponentName}
                  </Text>
                  <Text>
                    {item.turn === currentUser?.uid ? "(Your Turn)" : ""}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        ) : (
          <Text>No ongoing games found.</Text>
        )}
      </ContainerComponent>
    </>
  );
}
