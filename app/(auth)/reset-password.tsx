import React, { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import ContainerComponent from "../../components/ContainerComponent";
import InputComponent from "../../components/InputComponent";
import ButtonComponent from "../../components/ButtonComponent";
import TitleComponent from "../../components/TitleComponent";
import { RootTabParamList } from "@/types/types";
import { useNavigation, NavigationProp } from "@react-navigation/native";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert("Email required", "Please enter your email address.");
    } else {
      sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Email sent",
        "Instructions to reset your password has been sent to your email address."
      );
      router.push("/login");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFE0" }}>
      <ContainerComponent>
        <TitleComponent>Reset password</TitleComponent>
        <InputComponent
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <ButtonComponent title="Reset password" onPress={handleResetPassword} />
      </ContainerComponent>
    </View>
  );
}
