import React from "react";
import { View, Text, StyleSheet, Image } from "react-native"; // Added Image
import BackButton from "./BackButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

interface HeaderComponentProps {
  title?: string;
  image?: any;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ title, image }) => {
  const router = useRouter();
  const onPress = () => {
    router.push("/menu/play");
  };

  return (
    <LinearGradient
      colors={["#FFD700", "#FFFFE0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <Text></Text>
      <Text></Text>
      {image ? (
        <Image source={image} style={styles.titleImage} resizeMode="contain" />
      ) : (
        <Text style={styles.title}>{title || "QuiMi"}</Text>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    display: "flex",
    paddingVertical: 30,
    paddingHorizontal: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
  },
  titleImage: {
    width: 150, // Adjust width as needed
    height: 50, // Adjust height as needed
  },
});

export default HeaderComponent;
