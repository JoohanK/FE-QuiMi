import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router"; // Lägg till useRouter
import categoriesData from "@/assets/json/categories.json";
import { db, auth } from "@/firebaseConfig";
import {
  doc,
  onSnapshot,
  updateDoc,
  getDoc,
  setDoc,
  collection,
} from "firebase/firestore"; // Lägg till setDoc och collection
import ButtonComponent from "@/components/ButtonComponent";

export default function MatchScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter(); // Lägg till router för att navigera till det nya spelet
  const [gameData, setGameData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [selectingCategory, setSelectingCategory] = useState(false);
  const [usedCategories, setUsedCategories] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);

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

          if (data.matchStatus === "completed") {
            setQuestions([]);
            setCurrentQuestionIndex(0);
            setCategory(null);
            setSelectingCategory(false);
            setShowStartButton(false);
            setShowQuestions(false);
          } else if (isMyTurn) {
            if (hasQuestions && (p1AnswersLength < 3 || p2AnswersLength < 3)) {
              if (
                questions.length === 0 ||
                JSON.stringify(questions) !==
                  JSON.stringify(roundData.questions)
              ) {
                setQuestions(roundData.questions || []);
                const categoryMatch = categoriesData.categories.find(
                  (cat) => cat.id === roundData.categoryId
                );
                setCategory(categoryMatch?.name || null);
              }
              setShowStartButton(!showQuestions);
              setSelectingCategory(false);
            } else if (isRoundStarter && !roundData.categoryId) {
              setSelectingCategory(false);
              setQuestions([]);
              setCurrentQuestionIndex(0);
              setShowStartButton(true);
              setShowQuestions(false);
            }
          } else {
            setQuestions([]);
            setCurrentQuestionIndex(0);
            setCategory(null);
            setSelectingCategory(false);
            setShowStartButton(false);
            setShowQuestions(false);
          }
        }
      },
      (error) => {
        console.error("Error fetching game data:", error);
      }
    );
    return () => unsubscribe();
  }, [id, isMyTurn, isRoundStarter, showQuestions]);

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
    setShowStartButton(true);
    setShowQuestions(false);
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
      await handleNextQuestion();
    } catch (error) {
      console.error("Error updating answer:", error);
    }
  };

  const handleNextQuestion = async () => {
    const gameRef = doc(db, "games", id as string);
    const docSnap = await getDoc(gameRef);
    const currentData = docSnap.data();
    if (!currentData) return;

    const roundData = currentData.rounds[currentRound] || {};
    const playerAnswers = isPlayer1
      ? roundData.player1Answers || []
      : roundData.player2Answers || [];

    if (playerAnswers.length < 3) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setShowStartButton(false);
      }
      return;
    } else {
      const isPlayer1Turn = gameData.turn === gameData.player1Id;
      const nextRoundStarter =
        currentRound % 2 === 0 ? gameData.player2Id : gameData.player1Id;
      const nextTurnId = isRoundStarter
        ? isPlayer1Turn
          ? gameData.player2Id
          : gameData.player1Id
        : nextRoundStarter;

      try {
        const opponentAnswers = isPlayer1
          ? roundData.player2Answers || []
          : roundData.player1Answers || [];

        if (isRoundStarter && opponentAnswers.length < 3) {
          await updateDoc(gameRef, { turn: nextTurnId });
          setQuestions([]);
          setCurrentQuestionIndex(0);
          setCategory(null);
          setShowStartButton(false);
          setShowQuestions(false);
        } else if (
          (roundData.player1Answers?.length || 0) >= 3 &&
          (roundData.player2Answers?.length || 0) >= 3
        ) {
          if (currentRound >= 3) {
            await updateDoc(gameRef, { matchStatus: "completed" });
          } else {
            setQuestions([]);
            setCurrentQuestionIndex(0);
            setCategory(null);
            setSelectingCategory(false);
            setShowStartButton(true);
            setShowQuestions(false);
            await updateDoc(gameRef, {
              turn: nextRoundStarter,
              currentRound: currentRound + 1,
            });
          }
        }
      } catch (error) {
        console.error("Error updating turn:", error);
      }
    }
  };

  const handleStartTurn = () => {
    setShowStartButton(false);
    const roundData = gameData?.rounds?.[currentRound] || {};
    if (isRoundStarter && !roundData.categoryId) {
      setSelectingCategory(true);
      setAvailableCategories(getCategories());
    } else if (roundData.questions?.length > 0) {
      setQuestions(roundData.questions);
      const categoryMatch = categoriesData.categories.find(
        (cat) => cat.id === roundData.categoryId
      );
      setCategory(categoryMatch?.name || null);
      setShowQuestions(true);
    }
  };

  const handlePlayAgain = async () => {
    try {
      // Hämta nuvarande speldata
      const gameRef = doc(db, "games", id as string);
      const docSnap = await getDoc(gameRef);
      const currentGame = docSnap.data();

      if (!currentGame) {
        console.error("No game data found.");
        return;
      }

      // Skapa ett nytt spel med omvända roller
      const newGameData = {
        player1Id: currentGame.player2Id, // Byt plats på spelarna
        player2Id: currentGame.player1Id,
        turn: currentGame.player2Id, // Den tidigare player2 börjar
        matchStatus: "in progress",
        player1Score: 0,
        player2Score: 0,
        rounds: [],
        currentRound: 0,

        createdAt: new Date().toISOString(),
      };

      // Skapa ett nytt dokument i "games"-samlingen
      const newGameRef = doc(collection(db, "games")); // Genererar ett nytt unikt ID
      await setDoc(newGameRef, newGameData);

      // Navigera till det nya spelet
      router.replace(`/match/${newGameRef.id}`);
    } catch (error) {
      console.error("Error creating new game:", error);
    }
  };

  if (!gameData) {
    return <ActivityIndicator size="large" color="blue" />;
  }

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
        <ButtonComponent title="Play Again" onPress={handlePlayAgain} />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Match ID: {id}</Text>
      <Text>Runda: {currentRound + 1}</Text>
      <Text>Min tur: {isMyTurn ? "Ja" : "Nej"}</Text>

      {isMyTurn && showStartButton && (
        <ButtonComponent
          onPress={handleStartTurn}
          title={
            isRoundStarter && !gameData?.rounds?.[currentRound]?.categoryId
              ? "Start new round"
              : "Play your turn"
          }
        />
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

      {showQuestions &&
        questions.length > 0 &&
        isMyTurn &&
        !selectingCategory && (
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
