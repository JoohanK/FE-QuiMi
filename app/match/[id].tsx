import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import categoriesData from "@/assets/json/categories.json";
import { db, auth } from "@/firebaseConfig";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";

export default function MatchScreen() {
  const { id } = useLocalSearchParams();
  const [gameData, setGameData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [selectingCategory, setSelectingCategory] = useState(false);
  const [usedCategories, setUsedCategories] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isPlayer1 = auth.currentUser?.uid === gameData?.player1Id;
  const isMyTurn = auth.currentUser?.uid === gameData?.turn;
  const isRoundStarter =
    (currentRound % 2 === 0 && isPlayer1) ||
    (currentRound % 2 === 1 && !isPlayer1);

  //Hämtar spelets data från Firestore
  //Uppdaterar state med spelets data
  //Sätter vilken runda som är den "aktuella" rundan
  //Sätter vilken fråga som är den "aktuella" frågan
  //Sätter vilka kategorier som har använts i spelet
  //Kollar om det är min tur och om jag är den som startar rundan
  //Kollar om det finns frågor i rundan och om någon spelare inte har svarat på 3 frågor
  useEffect(() => {
    if (!id) return;

    const gameRef = doc(db, "games", id as string);
    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        const data = snapshot.data();
        console.log("Firestore data:", JSON.stringify(data, null, 2));
        if (data) {
          setGameData(data);
          const newCurrentRound = getCurrentRound(data);
          setCurrentRound(newCurrentRound);
          const rounds = Array.isArray(data.rounds) ? data.rounds : [];
          setUsedCategories(
            rounds.map((r: any) => r?.categoryId).filter(Boolean)
          );

          const roundData = rounds[newCurrentRound] || {};
          const hasQuestions = roundData.questions?.length > 0;
          const p1AnswersLength = roundData.player1Answers?.length || 0;
          const p2AnswersLength = roundData.player2Answers?.length || 0;

          console.log("useEffect - Before setting questions:", {
            isMyTurn,
            hasQuestions,
            p1AnswersLength,
            p2AnswersLength,
            currentQuestionsLength: questions.length,
          });

          if (data.matchStatus === "completed") {
            setQuestions([]);
            setCurrentQuestionIndex(0);
            setCategory(null);
            setSelectingCategory(false);
          } else if (isMyTurn) {
            // Om det är min tur, det finns frågor och någon spelare inte har svarat på 3 frågor, då ska jag se och svara på frågorna från rundan. Alltså rundan är redan igång.
            if (hasQuestions && (p1AnswersLength < 3 || p2AnswersLength < 3)) {
              // Om det inte finns några frågor i state eller om frågorna i state inte matchar frågorna från rundan, då ska frågorna och kategorin sättas i state.
              if (
                questions.length === 0 ||
                JSON.stringify(questions) !==
                  JSON.stringify(roundData.questions)
              ) {
                console.log("useEffect - Setting questions from roundData");
                setQuestions(roundData.questions || []);
                const categoryMatch = categoriesData.categories.find(
                  (cat) => cat.id === roundData.categoryId
                );
                setCategory(categoryMatch?.name || null);
              } else {
                console.log(
                  "useEffect - Questions already set, no update needed"
                );
              }
              //Annars starta en ny runda om det är min tur och jag är den som startar rundan och det inte finns en kategori för rundan.
            } else if (isRoundStarter && !roundData.categoryId) {
              console.log("useEffect - Setting selectingCategory to true");
              setSelectingCategory(true);
              setAvailableCategories(getCategories());
              setQuestions([]);
              setCurrentQuestionIndex(0);
            }
          } else {
            console.log("useEffect - Not my turn, clearing questions");
            setQuestions([]);
            setCurrentQuestionIndex(0);
            setCategory(null);
            setSelectingCategory(false);
          }

          console.log("useEffect - After setting questions:", questions);
        }
      },
      (error) => {
        console.error("Error fetching game data:", error);
      }
    );
    return () => unsubscribe();
  }, [id, isMyTurn, isRoundStarter]);

  // används för att bestämma vilken runda i spelet som är den "aktuella" rundan baserat på spelets data
  const getCurrentRound = (data: any) => {
    const rounds = Array.isArray(data?.rounds) ? data.rounds : [];
    if (rounds.length === 0) return 0;
    const unfinishedRoundIndex = rounds.findIndex(
      (round: any) =>
        (round?.player1Answers?.length || 0) < 3 ||
        (round?.player2Answers?.length || 0) < 3
    );
    return unfinishedRoundIndex === -1
      ? rounds.length - 1
      : unfinishedRoundIndex;
  };

  //Hämtar 4 kategorier som inte har använts i spelet från kategorilistan i min assetsmapp
  const getCategories = () => {
    const categories = categoriesData.categories || [];
    const available = categories.filter(
      (cat) => !usedCategories.includes(cat.id)
    );
    //inte perfekt blandning men duger för min app, en helt korrekt blandning skulle kräva "Fisher-Yates" shuffle
    return [...available].sort(() => 0.5 - Math.random()).slice(0, 4);
  };

  //När man klickar på en kategori så sätter jag den i state och sen hämtar frågor från den kategorin
  const handleCategorySelection = async (selectedCategory: any) => {
    setCategory(selectedCategory.name);
    setSelectingCategory(false);
    const fetchedQuestions = await fetchQuestions(selectedCategory.id);
    try {
      //Hämtar en snapshot av spelet från Firestore innan jag uppdaterar det
      const gameRef = doc(db, "games", id as string);
      const docSnap = await getDoc(gameRef);
      const currentData = docSnap.data();
      //Dubbelkollar så att rounds är en array innan jag uppdaterar den
      if (currentData && Array.isArray(currentData.rounds)) {
        //Skapar en kopia av rounds-arrayen
        //Uppdaterar den aktuella rundens kategori och frågor
        const updatedRounds = [...currentData.rounds];
        updatedRounds[currentRound] = {
          ...updatedRounds[currentRound],
          categoryId: selectedCategory.id,
          questions: fetchedQuestions,
        };
        await updateDoc(gameRef, { rounds: updatedRounds });
        setQuestions(fetchedQuestions);
        setCurrentQuestionIndex(0);
      }
    } catch (error) {
      console.error("Error updating category and questions:", error);
    }
  };

  const fetchQuestions = async (categoryId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://opentdb.com/api.php?amount=3&category=${categoryId}&type=multiple`
      );
      const data = await response.json();
      if (data.response_code === 0) {
        //mappar igenom svaret från API för att skapa nya object för varje fråga med tre egenskaper: question, correctAnswer och allAnswers
        const formattedQuestions = data.results.map((item: any) => ({
          question: item.question,
          correctAnswer: item.correct_answer,
          allAnswers: sortAnswers([
            item.correct_answer,
            ...item.incorrect_answers,
          ]),
        }));
        setIsLoading(false);
        return formattedQuestions;
      } else {
        alert("Failed to fetch questions. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
    return [];
  };

  //Sorterar svar så att nummer hamnar först och sedan i bokstavsordning
  const sortAnswers = (answers: string[]) => {
    return answers.sort((a, b) => {
      if (!isNaN(Number(a)) && !isNaN(Number(b))) {
        return Number(a) - Number(b);
      }
      return a.localeCompare(b);
    });
  };

  const handleAnswer = async (selectedAnswer: string) => {
    const gameRef = doc(db, "games", id as string);
    const docSnap = await getDoc(gameRef);
    const currentData = docSnap.data();
    //Om spelet inte finns eller om matchen är avslutad så return, annars kan man svara på sista frågan oändligt.
    if (!currentData || currentData.matchStatus === "completed") return;

    //Hämta data för aktuell runda och spelares svar
    const roundData = currentData.rounds[currentRound] || {};
    const currentPlayerAnswers = isPlayer1
      ? roundData.player1Answers || []
      : roundData.player2Answers || [];

    // Strikt kontroll: max 3 svar
    if (currentPlayerAnswers.length >= 3) {
      console.log("Player has already answered 3 questions, skipping save.");
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    //En boolean som indikerar om svaret var rätt (t.ex. true eller false).
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const newAnswer = { answer: selectedAnswer, isCorrect };
    const answersField = isPlayer1 ? "player1Answers" : "player2Answers";
    const scoreField = isPlayer1 ? "player1Score" : "player2Score";

    try {
      //Skapar en kopia av rounds-arrayen för att sen ändra den och uppdatera den i Firestore
      const updatedRounds = [...currentData.rounds];
      const currentAnswers = updatedRounds[currentRound][answersField] || [];
      //Uppdaaterar den aktuella rundan
      updatedRounds[currentRound] = {
        //Behåller alla befintliga egenskaper (t.ex. categoryId, questions)
        ...updatedRounds[currentRound],
        //Lägger till det nya svaret (newAnswer) i spelarens svarsarray.
        [answersField]: [...currentAnswers, newAnswer],
      };
      //Uppdaterar spelet med de nya svaren och poängen
      await updateDoc(gameRef, {
        rounds: updatedRounds,
        [scoreField]: currentData[scoreField] + (isCorrect ? 1 : 0),
      });
      console.log("Answer saved:", selectedAnswer, "isCorrect:", isCorrect);
      await handleNextQuestion();
    } catch (error) {
      console.error("Error updating answer:", error);
    }
  };

  //En asynkron funktion som hanterar övergången till nästa fråga eller nästa runda efter att en spelare har svarat
  const handleNextQuestion = async () => {
    console.log(
      "handleNextQuestion called. Current index:",
      currentQuestionIndex,
      "Questions length:",
      questions.length
    );

    // Hämta aktuell data från Firestore för att alltid ha korrekt tillstånd
    const gameRef = doc(db, "games", id as string);
    const docSnap = await getDoc(gameRef);
    const currentData = docSnap.data();
    if (!currentData) return;

    const roundData = currentData.rounds[currentRound] || {};
    const playerAnswers = isPlayer1
      ? roundData.player1Answers || []
      : roundData.player2Answers || [];

    // Om det finns fler frågor i rundan så öka index för aktuell fråga
    if (playerAnswers.length < 3) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        console.log("Next question index set to:", currentQuestionIndex + 1);
      } else {
        console.log("Player finished their questions, waiting for opponent");
      }
      return; // Avsluta här, ingen turväxling förrän alla 3 frågor är besvarade
    } else {
      // Om det inte finns fler frågor i rundan för spelaren (dvs. 3 svar givna)
      //Bestäm nästa tur
      const isPlayer1Turn = gameData.turn === gameData.player1Id;
      //I och med att jag vet att player 1 alltid startar runda med index, 0 och 2, kan jag räkna ut nextRoundStarter
      const nextRoundStarter =
        currentRound % 2 === 0 ? gameData.player2Id : gameData.player1Id;

      //OM jag är roundstarter, har gjort mina tre frågor och jag är player 1, byt då till player 2, annars byt till player 1.
      //Om jag inte är roundstarter och jag gjort mina tre frågor innebär detta att en ny runda skall sättas igång, byt till nextRoundStarter, som kommer vara mig själv
      const nextTurnId = isRoundStarter
        ? isPlayer1Turn
          ? gameData.player2Id
          : gameData.player1Id
        : nextRoundStarter;

      console.log("Switching turn - isRoundStarter:", isRoundStarter);
      console.log("Switching turn - Current turn:", gameData.turn);
      console.log("Switching turn - Next turn:", nextTurnId);

      try {
        const opponentAnswers = isPlayer1
          ? roundData.player2Answers || []
          : roundData.player1Answers || [];

        if (isRoundStarter && opponentAnswers.length < 3) {
          // Rundstartaren har svarat på sina 3 frågor, växla till motståndaren
          await updateDoc(gameRef, { turn: nextTurnId });
          console.log("Turn switched to:", nextTurnId);
          setQuestions([]);
          setCurrentQuestionIndex(0);
          setCategory(null);
        } else if (
          (roundData.player1Answers?.length || 0) >= 3 &&
          (roundData.player2Answers?.length || 0) >= 3
        ) {
          // Båda spelarna har svarat på 3 frågor
          if (currentRound >= 3) {
            await updateDoc(gameRef, { matchStatus: "completed" });
            console.log("Match completed");
          } else {
            setQuestions([]);
            setCurrentQuestionIndex(0);
            setCategory(null);
            setSelectingCategory(true);
            setAvailableCategories(getCategories());
            console.log("Round completed, selecting category for next round");
            await updateDoc(gameRef, {
              turn: nextRoundStarter,
              currentRound: currentRound + 1,
            });
          }
        } else {
          // Motståndaren har svarat på sina 3 frågor, men rundan är inte klar än
          console.log("Opponent hasn't finished yet, no action taken");
        }

        const updatedDocSnap = await getDoc(gameRef);
        const updatedData = updatedDocSnap.data();
        console.log("Firestore after update - turn:", updatedData?.turn);
      } catch (error) {
        console.error("Error updating turn:", error);
      }
    }
  };

  const handleStartRound = () => {
    if (isRoundStarter && !gameData?.rounds?.[currentRound]?.categoryId) {
      setSelectingCategory(true);
      setAvailableCategories(getCategories());
    }
  };

  if (!gameData) {
    return <ActivityIndicator size="large" color="blue" />;
  }

  console.log("Render - questions:", questions);
  console.log("Render - currentQuestionIndex:", currentQuestionIndex);
  console.log("Render - isMyTurn:", isMyTurn);
  console.log("Render - selectingCategory:", selectingCategory);

  // "Game Over"-skärm
  if (gameData.matchStatus === "completed") {
    return (
      <View
        style={{
          padding: 20,
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <Text style={{ fontSize: 32, fontWeight: "bold", marginBottom: 20 }}>
          Game Over!
        </Text>
        <Text style={{ fontSize: 20 }}>
          Player 1 Score: {gameData.player1Score}
        </Text>
        <Text style={{ fontSize: 20, marginBottom: 20 }}>
          Player 2 Score: {gameData.player2Score}
        </Text>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          {gameData.player1Score > gameData.player2Score
            ? "Player 1 Wins!"
            : gameData.player2Score > gameData.player1Score
            ? "Player 2 Wins!"
            : "It's a Tie!"}
        </Text>
        <TouchableOpacity
          onPress={() => console.log("New game")} // Fungerar i webbläsare, för mobil kan du använda navigation
          style={{
            backgroundColor: "blue",
            padding: 15,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "white", fontSize: 18 }}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Match ID: {id}</Text>
      <Text>Runda: {currentRound + 1}</Text>
      <Text>Min tur: {isMyTurn ? "Ja" : "Nej"}</Text>

      {questions.length === 0 &&
        !selectingCategory &&
        isMyTurn &&
        !gameData?.rounds?.[currentRound]?.questions?.length && (
          <TouchableOpacity
            onPress={handleStartRound}
            style={{
              backgroundColor: "blue",
              padding: 10,
              borderRadius: 5,
              marginTop: 20,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Starta runda {currentRound + 1}
            </Text>
          </TouchableOpacity>
        )}

      {selectingCategory && isMyTurn && isRoundStarter && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18 }}>Choose Category:</Text>
          {availableCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategorySelection(cat)}
              style={{
                padding: 10,
                backgroundColor: "lightgray",
                marginVertical: 5,
                borderRadius: 5,
              }}
            >
              <Text>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading && (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      )}

      {questions.length > 0 && isMyTurn && !selectingCategory && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Kategori: {category}
          </Text>
          <Text style={{ fontSize: 16, marginTop: 10 }}>
            {currentQuestionIndex + 1}.{" "}
            {questions[currentQuestionIndex]?.question || ""}
          </Text>
          {questions[currentQuestionIndex]?.allAnswers?.map(
            (answer: string, ansIndex: number) => (
              <TouchableOpacity
                key={ansIndex}
                onPress={() => handleAnswer(answer)}
                style={{
                  backgroundColor: "lightblue",
                  padding: 10,
                  marginVertical: 5,
                  borderRadius: 5,
                }}
              >
                <Text>{answer}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      {!isMyTurn && (
        <Text style={{ marginTop: 20 }}>Väntar på motståndaren...</Text>
      )}
    </View>
  );
}
