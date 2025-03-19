import React, { useState, useEffect } from "react";
import { Text, View, Pressable, FlatList } from "react-native";
import Modal from "react-native-modal";
import { useRouter } from "expo-router";
import ContainerComponent from "@/components/ContainerComponent";
import ButtonComponent from "@/components/ButtonComponent";
import FlexRowContainer from "@/components/FlexRowContainer";
import TitleComponent from "@/components/TitleComponent";
import { auth, db } from "@/firebaseConfig"; // Importera Firebase-konfiguration
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { profileFromId, UserProfile } from "@/utils/profileFromId"; // För att hämta motståndarens namn

interface Game {
  id: string;
  player1Id: string;
  player2Id: string;
  turn: string;
  matchStatus: string;
  opponentName?: string; // Lägg till motståndarens namn
}

export default function Play() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [ongoingGames, setOngoingGames] = useState<Game[]>([]);
  const router = useRouter();
  const currentUser = auth.currentUser;

  console.log("Play page loaded");

  // Hämta pågående spel
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

    const fetchOpponentNames = async (games: Game[]) => {
      const updatedGames = await Promise.all(
        games.map(async (game) => {
          const opponentId =
            game.player1Id === currentUser.uid
              ? game.player2Id
              : game.player1Id;
          const profile = await profileFromId(opponentId);
          return { ...game, opponentName: profile?.displayName || "Unknown" };
        })
      );
      setOngoingGames(updatedGames);
    };

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const games = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Game[];
      fetchOpponentNames(games);
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const games = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Game[];
      fetchOpponentNames(games);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser?.uid]);

  const toggleModal = () => {
    console.log("Play button pressed");
    setIsModalVisible(!isModalVisible);
  };

  const handleSolo = () => {
    console.log("Move to Match page (Solo)");
    router.push("/match/create-match?mode=solo");
    toggleModal();
  };

  const handleChallenge = () => {
    console.log("Move to Match page (Challenge)");
    router.push("/match/create-match?mode=challenge");
    toggleModal();
  };

  const handleResumeGame = (gameId: string) => {
    console.log("Resuming game with ID:", gameId);
    router.push(`/match/${gameId}`);
  };

  return (
    <ContainerComponent>
      <TitleComponent>Play</TitleComponent>

      {/* Visa pågående spel */}
      {ongoingGames.length > 0 ? (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Ongoing Games
          </Text>
          <FlatList
            data={ongoingGames}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleResumeGame(item.id)}
                style={{
                  padding: 10,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 5,
                  marginVertical: 5,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text>
                  vs {item.opponentName}{" "}
                  {item.turn === currentUser?.uid ? "(Your Turn)" : ""}
                </Text>
                <Text style={{ color: "blue" }}>Resume</Text>
              </Pressable>
            )}
          />
        </View>
      ) : (
        <Text>No ongoing games found.</Text>
      )}

      {/* Knapp för att starta nytt spel */}
      <ButtonComponent title="Start New Game" onPress={toggleModal} />

      {/* Modal för att välja spelläge */}
      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal}>
        <ContainerComponent>
          <TitleComponent>Choose Game Mode</TitleComponent>
          <ButtonComponent title="Solo" onPress={handleSolo} />
          <ButtonComponent
            title="Challenge a Friend"
            onPress={handleChallenge}
          />
        </ContainerComponent>
      </Modal>
    </ContainerComponent>
  );
}
