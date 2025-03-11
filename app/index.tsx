// index.tsx
import React, { useEffect, useContext } from "react";
import { Text, Button, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";

export default function Index() {
  const router = useRouter();
  const { user, setUser } = useContext(AuthContext);

  return (
    <View>
      <Text>hej</Text>
    </View>
  );
}
