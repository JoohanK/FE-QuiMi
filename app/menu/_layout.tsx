import React, { useContext } from "react";
import { Slot, Redirect } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Play from "./Play";
import Friends from "./Friends";
import Profile from "./Profile";
import HeaderComponent from "../../components/HeaderComponent";
import AddFriend from "./AddFriend";

const Tab = createBottomTabNavigator();

type IoniconsName =
  | "play"
  | "play-outline"
  | "people"
  | "people-outline"
  | "person-circle"
  | "person-circle-outline"
  | "help-circle-outline"
  | "person-add"
  | "person-add-outline";

export default function MenuLayout() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Redirect href="/(auth)/Login" />;
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
            } else if (route.name === "addFriends") {
              iconName = focused ? "person-add" : "person-add-outline";
            }

            return <Ionicons name={iconName} size={30} color={color} />;
          },
          tabBarActiveTintColor: "tomato",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { height: 120 },
        })}
      >
        <Tab.Screen name="play" component={Play} options={{ title: "Play" }} />
        <Tab.Screen
          name="friends"
          component={Friends}
          options={{ title: "Friends" }}
        />
        <Tab.Screen // Byt plats på Profile och AddFriend
          name="addFriends"
          component={AddFriend}
          options={{ title: "Add Friends" }}
        />
        <Tab.Screen // Byt plats på Profile och AddFriend
          name="profile"
          component={Profile}
          options={{ title: "Profile" }}
        />
      </Tab.Navigator>
    </>
  );
}
