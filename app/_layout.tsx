import { Slot } from "expo-router";
import { AuthProvider, AuthContext } from "../context/AuthContext";
import KeyboardDismissWrapper from "../components/KeyboardDismissWrapper";
import { StatusBar, Appearance } from "react-native";
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useContext } from "react";
import { useRouter } from "expo-router";

export default function RootLayout() {
  StatusBar.setBarStyle("dark-content"); // Force light content
  Appearance.setColorScheme("light"); // Force dark mode (optional)

  const { user, setUser } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        router.replace("/login");
      } else {
        router.replace("/menu/play");
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthProvider>
      <KeyboardDismissWrapper>
        <Slot />
      </KeyboardDismissWrapper>
    </AuthProvider>
  );
}
