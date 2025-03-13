import React, { useState, useContext } from "react";
import { StyleSheet } from "react-native";
import { auth } from "../../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import ContainerComponent from "../../components/ContainerComponent";
import InputComponent from "../../components/InputComponent";
import ButtonComponent from "../../components/ButtonComponent";
import TitleComponent from "../../components/TitleComponent";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootTabParamList } from "@/types/types";

// Definiera typen för dina rutt

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setUser } = useContext(AuthContext);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>(); // Typa navigation

  const handleSubmit = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      alert("User signed in: " + userCredential.user.email);
    } catch (error) {
      alert(error);
    }
  };

  return (
    <ContainerComponent>
      <TitleComponent>Sign in</TitleComponent>
      <InputComponent
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
      />
      <InputComponent
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
      />
      <ButtonComponent title="Sign in" onPress={handleSubmit} />

      <ButtonComponent
        title="Forgot password?"
        onPress={() => {
          navigation.navigate("resetPassword");
        }}
      />
    </ContainerComponent>
  );
}
