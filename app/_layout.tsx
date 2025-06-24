import { Slot } from "expo-router";
import { AuthProvider, AuthContext } from "../context/AuthContext";
import KeyboardDismissWrapper from "../components/KeyboardDismissWrapper";
import { StatusBar, Appearance, View, StyleSheet } from "react-native";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useContext, useState } from "react";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  StatusBar.setBarStyle("dark-content");

  const { setUser } = useContext(AuthContext);
  const router = useRouter();
  const [initialNavigationDone, setInitialNavigationDone] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        router.replace("/login");
      } else if (!initialNavigationDone) {
        router.replace("/menu/play");
        setInitialNavigationDone(true);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView>
      <AuthProvider>
        <KeyboardDismissWrapper>
          <Slot />
        </KeyboardDismissWrapper>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
