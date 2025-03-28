import React, { useContext, useState, useEffect } from "react";
import { Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { auth, db } from "../../firebaseConfig";
import { signOut, updateProfile } from "firebase/auth";
import {
  setDoc,
  doc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { Alert } from "react-native";
import ButtonComponent from "@/components/ButtonComponent";
import ContainerComponent from "../../components/ContainerComponent";
import InputComponent from "@/components/InputComponent";
import TitleComponent from "@/components/TitleComponent";
import EmojiPicker from "@/components/EmojiPicker";
import ProfileEmoji from "@/components/ProfileEmoji";
import DisplayNameComponent from "@/components/DisplayNameComponent";
import FlexRowContainer from "@/components/FlexRowContainer";

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(
    user?.photoURL || null
  );

  useEffect(() => {
    if (user) {
      // Om displayName finns, använd det, annars ta e-postadressen före @
      const emailUsername = user.email ? user.email.split("@")[0] : "";
      setDisplayName(user.displayName || emailUsername);
    }
  }, [user]);

  const handleEmojiSelected = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleSave = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      if (auth.currentUser) {
        const lowercaseDisplayName = displayName.toLowerCase();
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("displayNameLowercase", "==", lowercaseDisplayName)
        );
        const querySnapshot = await getDocs(q);

        const displayNameExists =
          !querySnapshot.empty &&
          querySnapshot.docs[0].id !== auth.currentUser.uid;

        if (displayNameExists) {
          setErrorMessage("Name already exists");
          setLoading(false);
          return;
        }

        if (displayName.length < 1) {
          setErrorMessage("Name must be at least 1 character long");
          setLoading(false);
          return;
        }

        if (displayName.length > 20) {
          setErrorMessage("Name must be at most 20 characters long");
          setLoading(false);
          return;
        }

        await updateProfile(auth.currentUser, {
          displayName: displayName,
          photoURL: selectedEmoji,
        });

        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          displayName: displayName,
          displayNameLowercase: lowercaseDisplayName,
          photoURL: selectedEmoji,
        });

        const updatedUser = auth.currentUser;
        setUser(updatedUser);

        alert("Profile successfully updated");
      }
    } catch (error) {
      console.error("Error updating display name:", error);
      setErrorMessage("Failed to update display name.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Are you sure?",
      "Do you really want to sign out?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await signOut(auth);
              setUser(null);
              router.replace("/login"); // Navigera till inloggningssidan
            } catch (error) {
              console.error("Error signing out:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!user) return null;

  return (
    <>
      <ContainerComponent>
        <TitleComponent>Customize profile</TitleComponent>
        <FlexRowContainer>
          <ProfileEmoji />
          <DisplayNameComponent />
        </FlexRowContainer>
        <Text></Text>
        {errorMessage ? (
          <Text style={{ color: "red" }}>{errorMessage}</Text>
        ) : null}
        <Text>Choose your display name</Text>
        <InputComponent
          placeholder="Name"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Text>Choose your Emoji</Text>
        <EmojiPicker onEmojiSelected={handleEmojiSelected} />

        {selectedEmoji && (
          <Text style={{ fontSize: 70, marginTop: 20 }}>{selectedEmoji}</Text>
        )}
      </ContainerComponent>
      <FlexRowContainer style={{ marginBottom: 10 }}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            <ButtonComponent title="Save" onPress={handleSave} />
            <ButtonComponent
              title="Sign out"
              style={{ backgroundColor: "red" }}
              onPress={handleSignOut}
            />
          </>
        )}
      </FlexRowContainer>
    </>
  );
}
