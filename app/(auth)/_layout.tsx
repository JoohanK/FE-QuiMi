import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthContext } from "../../context/AuthContext";
import { Redirect } from "expo-router";
import Login from "./login";
import Register from "./register";
import ResetPassword from "./reset-password";
import { Ionicons } from "@expo/vector-icons";
import HeaderComponent from "../../components/HeaderComponent";
import { SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const Tab = createBottomTabNavigator();

type IoniconsName =
  | "log-in"
  | "log-in-outline"
  | "person-add"
  | "person-add-outline"
  | "refresh-circle"
  | "refresh-circle-outline"
  | "help-circle-outline";

export default function Layout() {
  return (
    <>
      <HeaderComponent image={require("../../assets/img/image.png")} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: IoniconsName = "help-circle-outline";

            if (route.name === "login") {
              iconName = focused ? "log-in" : "log-in-outline";
            } else if (route.name === "register") {
              iconName = focused ? "person-add" : "person-add-outline";
            } else if (route.name === "resetPassword") {
              iconName = focused ? "refresh-circle" : "refresh-circle-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "tomato",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { height: 100, backgroundColor: "transparent" }, // Gör bakgrunden transparent
          tabBarBackground: () => (
            <LinearGradient
              colors={["#FFFFE0", "#FFD700"]} // Ljusare gul till mörkare gul
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          ),
        })}
      >
        <Tab.Screen
          name="login"
          component={Login}
          options={{ title: "Sign In" }}
        />
        <Tab.Screen
          name="register"
          component={Register}
          options={{ title: "Register" }}
        />
        <Tab.Screen
          name="resetPassword"
          component={ResetPassword}
          options={{ title: "Reset Password" }}
        />
      </Tab.Navigator>
    </>
  );
}
