import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BackButton from "./BackButton";
import { useLocalSearchParams, useRouter } from "expo-router";

interface HeaderComponentProps {
  title: string;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ title }) => {
  const router = useRouter();
  const onPress = () => {
    router.push("/menu/play");
  };

  return (
    <>
      <View style={styles.header}>
        <Text></Text>
        <Text></Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    display: "flex",
    backgroundColor: "white",
    paddingVertical: 30,
    paddingHorizontal: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default HeaderComponent;
