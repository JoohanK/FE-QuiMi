import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import categoriesData from "@/assets/json/categories.json";
import { db, auth } from "@/firebaseConfig";

import { doc, onSnapshot, updateDoc } from "firebase/firestore";

export default function MatchScreen() {
  const { id } = useLocalSearchParams();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectingCategory, setSelectingCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [usedCategories, setUsedCategories] = useState<number[]>([]);
  const gameId = typeof id === "string" ? id : "";
  const [game, setGame] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);

  //Get 4 different unik categories to show the user.
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
    setGameStarted(true);
    setUsedCategories([...usedCategories, selectedCategory.id]);
    await fetchQuestions(selectedCategory.id);
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
        setQuestions(formattedQuestions);
      } else {
        alert("Failed to fetch questions. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      alert("An error occurred. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
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
    const currentQuestion = questions[currentQuestionIndex];
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
      console.log("Right answer!");
    }
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (currentRound < 4) {
        alert(`Round ${currentRound} complete! Score: ${score}`);
        setCurrentRound(currentRound + 1);
        setGameStarted(false);
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setSelectingCategory(true);
        setAvailableCategories(getCategories());
      } else {
        alert(`Game over! Final score: ${score}`);
        setGameStarted(false);
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setCurrentRound(1);
        setScore(0);
        setUsedCategories([]);
      }
    }
  };

  const handleStart = () => {
    setSelectingCategory(true);
    setAvailableCategories(getCategories());
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Match ID: {id}</Text>

      {!gameStarted && !selectingCategory && (
        <TouchableOpacity
          onPress={handleStart}
          style={{
            backgroundColor: "blue",
            padding: 10,
            borderRadius: 5,
            marginTop: 20,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            Start round 1
          </Text>
        </TouchableOpacity>
      )}

      {selectingCategory && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18 }}>Select a category:</Text>
          {availableCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategorySelection(category)}
              style={{
                padding: 10,
                backgroundColor: "lightgray",
                marginVertical: 5,
                borderRadius: 5,
              }}
            >
              <Text>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading && (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      )}

      {gameStarted && questions.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Category: {category}
          </Text>
          <Text style={{ fontSize: 16, marginTop: 10 }}>
            {currentQuestionIndex + 1}.{" "}
            {questions[currentQuestionIndex].question}
          </Text>

          {questions[currentQuestionIndex].allAnswers.map(
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
    </View>
  );
}
