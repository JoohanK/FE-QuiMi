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
            if (hasQuestions && (p1AnswersLength < 3 || p2AnswersLength < 3)) {
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

  const getCategories = () => {
    const categories = categoriesData.categories || [];
    const available = categories.filter(
      (cat) => !usedCategories.includes(cat.id)
    );
    return [...available].sort(() => 0.5 - Math.random()).slice(0, 4);
  };

  const handleCategorySelection = async (selectedCategory: any) => {
    setCategory(selectedCategory.name);
    setSelectingCategory(false);
    const fetchedQuestions = await fetchQuestions(selectedCategory.id);
    try {
      const gameRef = doc(db, "games", id as string);
      const docSnap = await getDoc(gameRef);
      const currentData = docSnap.data();
      if (currentData && Array.isArray(currentData.rounds)) {
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
    if (!currentData || currentData.matchStatus === "completed") return;

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
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const newAnswer = { answer: selectedAnswer, isCorrect };
    const answersField = isPlayer1 ? "player1Answers" : "player2Answers";
    const scoreField = isPlayer1 ? "player1Score" : "player2Score";

    try {
      const updatedRounds = [...currentData.rounds];
      const currentAnswers = updatedRounds[currentRound][answersField] || [];
      updatedRounds[currentRound] = {
        ...updatedRounds[currentRound],
        [answersField]: [...currentAnswers, newAnswer],
      };
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

  const handleNextQuestion = async () => {
    console.log(
      "handleNextQuestion called. Current index:",
      currentQuestionIndex,
      "Questions length:",
      questions.length
    );
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      console.log("Next question index set to:", currentQuestionIndex + 1);
    } else {
      const gameRef = doc(db, "games", id as string);
      const docSnap = await getDoc(gameRef);
      const currentData = docSnap.data();
      if (!currentData) return;

      const roundData = currentData.rounds[currentRound] || {};
      const isPlayer1Turn = gameData.turn === gameData.player1Id;
      const nextRoundStarter =
        currentRound % 2 === 0 ? gameData.player2Id : gameData.player1Id;
      const nextTurn = isRoundStarter
        ? isPlayer1Turn
          ? gameData.player2Id
          : gameData.player1Id
        : nextRoundStarter;

      console.log("Switching turn - isRoundStarter:", isRoundStarter);
      console.log("Switching turn - Current turn:", gameData.turn);
      console.log("Switching turn - Next turn:", nextTurn);

      try {
        if (isRoundStarter) {
          await updateDoc(gameRef, { turn: nextTurn });
          console.log("Turn switched to:", nextTurn);
          setQuestions([]);
          setCurrentQuestionIndex(0);
          setCategory(null);
        } else if (
          (roundData.player1Answers?.length || 0) >= 3 &&
          (roundData.player2Answers?.length || 0) >= 3
        ) {
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
          await updateDoc(gameRef, { turn: nextTurn });
          console.log("Turn switched to:", nextTurn);
          setQuestions([]);
          setCurrentQuestionIndex(0);
          setCategory(null);
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
          <Text style={{ fontSize: 18 }}>Välj en kategori:</Text>
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
