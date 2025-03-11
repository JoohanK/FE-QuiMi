import React, { useContext } from "react";
import { Slot, Redirect } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Play from "./play";
import Friends from "./friends";
import Profile from "./profile";
import HeaderComponent from "../../components/HeaderComponent";

const Tab = createBottomTabNavigator();

type IoniconsName =
  | "play"
  | "play-outline"
  | "people"
  | "people-outline"
  | "person-circle"
  | "person-circle-outline"
  | "help-circle-outline";

export default function MenuLayout() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <HeaderComponent title="QuiMi" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: IoniconsName = "help-circle-outline";

            if (route.name === "play") {
              iconName = focused ? "play" : "play-outline";
            } else if (route.name === "friends") {
              iconName = focused ? "people" : "people-outline";
            } else if (route.name === "profile") {
              iconName = focused ? "person-circle" : "person-circle-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "tomato",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="play" component={Play} options={{ title: "Play" }} />
        <Tab.Screen
          name="friends"
          component={Friends}
          options={{ title: "Friends" }}
        />
        <Tab.Screen
          name="profile"
          component={Profile}
          options={{ title: "Profile" }}
        />
      </Tab.Navigator>
    </>
  );
}
