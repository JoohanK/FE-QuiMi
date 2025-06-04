import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";

interface ProfileDisplayProps {
  size?: number;
}

const ProfileEmoji: React.FC<ProfileDisplayProps> = ({ size = 130 }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {user.photoURL ? (
        <Text style={styles.emoji}>{user.photoURL}</Text>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "black",
  },
  emoji: {
    fontSize: 90,
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
    borderRadius: 100,
  },
});

export default ProfileEmoji;
