import React, { useState, useContext } from "react";
import { StyleSheet } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { setDoc, doc } from "firebase/firestore";
import { AuthContext } from "@/context/AuthContext";
import ContainerComponent from "../../components/ContainerComponent";
import InputComponent from "../../components/InputComponent";
import ButtonComponent from "../../components/ButtonComponent";
import TitleComponent from "../../components/TitleComponent";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        displayName: user.email,
        email: user.email,
        photoURL: "",
        createdAt: new Date(),
      });

      alert("User registered: " + user.email);
      setUser(user);
    } catch (error) {
      console.error("Registration error:", error);
      alert(error);
    }
  };

  return (
    <ContainerComponent>
      <TitleComponent>Register</TitleComponent>
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
      <ButtonComponent title="Register" onPress={handleSubmit} />
      <ButtonComponent
        title="Already have an account? Sign in"
        onPress={() => router.push("/login")}
      />
    </ContainerComponent>
  );
}
