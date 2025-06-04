import React, { useState, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "expo-router";
import { setDoc, doc } from "firebase/firestore";
import { AuthContext } from "@/context/AuthContext";
import ContainerComponent from "../../components/ContainerComponent";
import InputComponent from "../../components/InputComponent";
import ButtonComponent from "../../components/ButtonComponent";
import TitleComponent from "../../components/TitleComponent";
import { RootTabParamList } from "@/types/types";
import { useNavigation, NavigationProp } from "@react-navigation/native";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setUser } = useContext(AuthContext);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();

  const handleSubmit = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const emailUsername = email.split("@")[0];

      await updateProfile(user, {
        displayName: emailUsername,
      });

      await setDoc(doc(db, "users", user.uid), {
        displayName: emailUsername,
        email: user.email,
        photoURL: "",
        createdAt: new Date(),
      });

      alert("User registered: " + user.email);
      setUser({ ...user, displayName: emailUsername });
    } catch (error) {
      console.error("Registration error:", error);
      alert(error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFE0" }}>
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
        <ButtonComponent
          title="Register"
          onPress={handleSubmit}
          style={{ marginBottom: 5 }}
        />
        <ButtonComponent
          title="Already have an account? Sign in"
          onPress={() => navigation.navigate("login")}
        />
      </ContainerComponent>
    </View>
  );
}
