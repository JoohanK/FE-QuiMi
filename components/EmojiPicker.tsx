// EmojiPicker.tsx
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";

interface EmojiPickerProps {
  onEmojiSelected: (emoji: string) => void;
}

interface EmojiList {
  profileEmojis: string[];
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelected }) => {
  const [profileEmojis, setProfileEmojis] = useState<string[]>([]);

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
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {profileEmojis.map((emoji) => (
        <TouchableOpacity key={emoji} onPress={() => onEmojiSelected(emoji)}>
          <Text style={{ fontSize: 30, margin: 5 }}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default EmojiPicker;
