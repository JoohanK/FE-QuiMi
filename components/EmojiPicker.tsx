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

  const screenWidth = Dimensions.get("window").width;
  const emojisPerRow = 9;
  const emojiContainerWidth = screenWidth / emojisPerRow;

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
            width: emojiContainerWidth,
            alignItems: "center",
            padding: 5,
          }}
        >
          <Text style={{ fontSize: 30 }}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default EmojiPicker;
