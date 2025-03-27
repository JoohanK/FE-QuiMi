import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, Dimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

interface EmojiPickerProps {
  onEmojiSelected: (emoji: string) => void;
}

interface EmojiList {
  profileEmojis: string[];
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelected }) => {
  const [profileEmojis, setProfileEmojis] = useState<string[]>([]);

  // Hämta skärmbredden för att beräkna emoji-storlek
  const screenWidth = Dimensions.get("window").width;
  const emojisPerRow = 9; // Antal emojis per rad
  const emojiContainerWidth = screenWidth / emojisPerRow; // Bredden för varje emoji-container

  useEffect(() => {
    const loadEmojis = async () => {
      try {
        const emojiData: EmojiList = require("../assets/json/emojiList.json");
        setProfileEmojis(emojiData.profileEmojis);
      } catch (error) {
        console.error("Error loading emojiList.json:", error);
      }
    };

    loadEmojis();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {profileEmojis.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          onPress={() => onEmojiSelected(emoji)}
          style={{
            width: emojiContainerWidth, // Fast bredd för att passa 6 per rad
            alignItems: "center", // Centrera emoji horisontellt
            padding: 5, // Lite padding för att undvika överlappning
          }}
        >
          <Text style={{ fontSize: 30 }}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default EmojiPicker;
