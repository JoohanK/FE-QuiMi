import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface QuestionCardProps {
  category: string | null;
  questionNumber: number;
  question: string;
  color?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  category,
  questionNumber,
  question,
  color,
}) => {
  return (
    <View style={[styles.card, { backgroundColor: color || "#fff" }]}>
      <Text style={styles.category}>{category || "Unknown Category"}</Text>
      <Text style={styles.questionNumber}>Question {questionNumber}</Text>
      <Text style={styles.questionText}>{question}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
  },
  category: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  questionNumber: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  questionText: {
    fontSize: 18,
    color: "#333",
    lineHeight: 24,
  },
});

export default QuestionCard;
