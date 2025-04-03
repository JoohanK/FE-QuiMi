import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import categoriesData from "@/assets/json/categories.json";
import { db, auth } from "@/firebaseConfig";
import {
  doc,
  onSnapshot,
  updateDoc,
  getDoc,
  setDoc,
  collection,
} from "firebase/firestore";
import ButtonComponent from "@/components/ButtonComponent";
import BackButton from "@/components/BackButton";
import he from "he";
import QuestionCard from "@/components/QuestionCard";
import TitleComponent from "@/components/TitleComponent";
import IsLoading from "@/components/IsLoading";

export default function MatchScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

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
          const newCurrentRound = data.currentRound || getCurrentRound(data);
          setCurrentRound(newCurrentRound);
          const rounds = Array.isArray(data.rounds) ? data.rounds : [];
          setUsedCategories(
            rounds.map((r: any) => r?.categoryId).filter(Boolean)
          );

          console.log(
            "useEffect: turn:",
            data.turn,
            "currentRound:",
            newCurrentRound,
            "isMyTurn:",
            isMyTurn
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
            } else if (isRoundStarter) {
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
  }, [id, isMyTurn, isRoundStarter, showQuestions, currentRound]);

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
          question: he.decode(item.question),
          correctAnswer: he.decode(item.correct_answer),
          allAnswers: sortAnswers(
            [item.correct_answer, ...item.incorrect_answers].map((answer) =>
              he.decode(answer)
            )
          ),
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

  const handleAnswer = (selectedAnswer: string) => {
    if (answerSubmitted) return;

    setSelectedAnswer(selectedAnswer);
    setAnswerSubmitted(true);
  };

  const handleNextQuestion = async () => {
    if (!answerSubmitted || !selectedAnswer) return;

    const gameRef = doc(db, "games", id as string);
    const docSnap = await getDoc(gameRef);
    const currentData = docSnap.data();
    if (!currentData || currentData.matchStatus === "completed") return;

    const rounds = Array.isArray(currentData.rounds) ? currentData.rounds : [];
    if (!rounds[currentRound]) {
      rounds[currentRound] = { player1Answers: [], player2Answers: [] };
    }
    const roundData = rounds[currentRound] || {};
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
      // Uppdatera rundan med det nya svaret
      rounds[currentRound] = {
        ...rounds[currentRound],
        [answersField]: [...currentPlayerAnswers, newAnswer],
        categoryId: roundData.categoryId || rounds[currentRound]?.categoryId,
        questions: roundData.questions || questions,
      };
      await updateDoc(gameRef, {
        rounds: rounds,
        [scoreField]: currentData[scoreField] + (isCorrect ? 1 : 0),
      });

      // Hämta uppdaterad data efter att svaret sparats
      const updatedDocSnap = await getDoc(gameRef);
      const updatedData = updatedDocSnap.data();
      const updatedRounds = Array.isArray(updatedData?.rounds)
        ? updatedData.rounds
        : [];
      const updatedRoundData = updatedRounds[currentRound] || {};
      const p1AnswersLength = updatedRoundData.player1Answers?.length || 0;
      const p2AnswersLength = updatedRoundData.player2Answers?.length || 0;
      const bothPlayersDone = p1AnswersLength >= 3 && p2AnswersLength >= 3;

      if (currentQuestionIndex < questions.length - 1) {
        // Gå till nästa fråga
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setShowStartButton(false);
      } else if (bothPlayersDone) {
        // Båda spelarna är klara med rundan
        if (currentRound >= 3) {
          console.log("Match completed, currentRound:", currentRound);
          await updateDoc(gameRef, {
            matchStatus: "completed",
            completedAt: new Date().toISOString(),
          });
        } else {
          const nextRound = currentRound + 1;
          const nextRoundStarter =
            nextRound % 2 === 0 ? gameData.player1Id : gameData.player2Id;
          console.log(
            "Both players done, currentRound:",
            currentRound,
            "nextRound:",
            nextRound,
            "nextRoundStarter:",
            nextRoundStarter
          );
          await updateDoc(gameRef, {
            turn: nextRoundStarter,
            currentRound: nextRound,
          });
          setQuestions([]);
          setCurrentQuestionIndex(0);
          setCategory(null);
          setSelectingCategory(false);
          setShowStartButton(true);
          setShowQuestions(false);
        }
      } else {
        // Bara en spelare är klar
        const nextTurnId = isPlayer1 ? gameData.player2Id : gameData.player1Id;
        console.log(
          "Only one player done, nextTurnId:",
          nextTurnId,
          "currentRound:",
          currentRound
        );
        await updateDoc(gameRef, { turn: nextTurnId });
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setCategory(null);
        setShowStartButton(false);
        setShowQuestions(false);
      }
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
    } catch (error) {
      console.error("Error updating answer or turn:", error);
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
    } else {
      setSelectingCategory(true);
      setAvailableCategories(getCategories());
    }
  };

  const handlePlayAgain = async () => {
    try {
      const gameRef = doc(db, "games", id as string);
      const docSnap = await getDoc(gameRef);
      const currentGame = docSnap.data();

      if (!currentGame) {
        console.error("No game data found.");
        return;
      }

      const newGameData = {
        player1Id: currentGame.player2Id,
        player2Id: currentGame.player1Id,
        turn: currentGame.player2Id,
        matchStatus: "in progress",
        player1Score: 0,
        player2Score: 0,
        rounds: [],
        currentRound: 0,
        createdAt: new Date().toISOString(),
      };

      const newGameRef = doc(collection(db, "games"));
      await setDoc(newGameRef, newGameData);

      router.replace(`/match/${newGameRef.id}`);
    } catch (error) {
      console.error("Error creating new game:", error);
    }
  };

  const onPress = () => {
    router.push("/menu/play");
  };

  if (!gameData) {
    return <ActivityIndicator size="large" color="blue" />;
  }

  if (gameData.matchStatus === "completed") {
    return (
      <>
        <BackButton style={{ marginLeft: 0 }} onPress={onPress}></BackButton>
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
      </>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      {isMyTurn && showStartButton && !isLoading && (
        <>
          <BackButton style={{ marginLeft: 0 }} onPress={onPress}></BackButton>
          <ButtonComponent
            onPress={handleStartTurn}
            title={
              isRoundStarter && !gameData?.rounds?.[currentRound]?.categoryId
                ? ("Start round " + (currentRound + 1)).toUpperCase()
                : "Play your turn"
            }
          />
        </>
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
                backgroundColor: cat.color || "lightgray",
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
        <IsLoading
          message="Fetching questions..."
          size="large"
          color="#1E90FF"
        />
      )}

      {showQuestions &&
        questions.length > 0 &&
        isMyTurn &&
        !selectingCategory && (
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              onPress={handleNextQuestion}
              disabled={!answerSubmitted}
            >
              <QuestionCard
                category={category}
                questionNumber={currentQuestionIndex + 1}
                question={questions[currentQuestionIndex]?.question || ""}
                color={
                  categoriesData.categories.find((cat) => cat.name === category)
                    ?.color
                }
              />
            </TouchableOpacity>
            {questions[currentQuestionIndex]?.allAnswers?.map(
              (answer: string, ansIndex: number) => {
                const isCorrect =
                  answer === questions[currentQuestionIndex].correctAnswer;
                const isSelected = answer === selectedAnswer;
                let backgroundColor = "lightblue";
                if (answerSubmitted) {
                  if (isCorrect) {
                    backgroundColor = "green";
                  } else if (isSelected) {
                    backgroundColor = "red";
                  }
                }

                return (
                  <TouchableOpacity
                    key={ansIndex}
                    onPress={() => handleAnswer(answer)}
                    style={{
                      backgroundColor,
                      padding: 10,
                      marginVertical: 5,
                      borderRadius: 5,
                      opacity: answerSubmitted ? 0.7 : 1,
                    }}
                    disabled={answerSubmitted}
                  >
                    <Text style={{ color: "white" }}>{answer}</Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        )}

      {!isMyTurn && (
        <>
          <BackButton style={{ marginLeft: 0 }} onPress={onPress}></BackButton>
          <Text style={{ marginTop: 20 }}>Opponent's turn..</Text>
        </>
      )}
    </View>
  );
}
