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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setUser } = useContext(AuthContext);

  /*   const discovery = AuthSession.useAutoDiscovery("https://accounts.google.com"); */

  /* const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId:
        Platform.OS === "web"
          ? "225607921317-h0rskonvg8qnqu11n82lmthcr7kjamp6.apps.googleusercontent.com"
          : "225607921317-baq61cd6n4r0iqn41jaati6ij860dvsq.apps.googleusercontent.com",
      scopes: ["profile", "email"],
      redirectUri: AuthSession.makeRedirectUri({ scheme: "com.johank.quimi" }), // Use your app scheme
    },
    discovery
  ); */

  /* useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === "success") {
        const { id_token } = response.params;
        const credential = GoogleAuthProvider.credential(id_token);
        try {
          const userCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;

          // Check if user exists in Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              username: user.displayName || user.email,
              email: user.email,
              profilePicture: user.photoURL || "",
              createdAt: new Date(),
            });
            alert("New user registered with Google: " + user.email);
          } else {
            alert("User signed in with Google: " + user.email);
          }

          setUser(user);
        } catch (error) {
          console.error("Google login error:", error);
          alert(error);
        }
      }
    };
    handleResponse();
  }, [response]); */

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

  /* const handleGoogleLogin = async () => {
    if (Platform.OS === "web") {
      try {
        const googleProvider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, googleProvider);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            username: user.displayName || user.email,
            email: user.email,
            profilePicture: user.photoURL || "",
            createdAt: new Date(),
          });
          alert("New user registered with Google: " + user.email);
        } else {
          alert("User signed in with Google: " + user.email);
        }

        setUser(user);
        console.log(user.displayName);
      } catch (error) {
        console.error("Google login error:", error);
        alert(error);
      }
    } else {
      promptAsync();
    }
  }; */

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
      {/* <Button
        disabled={Platform.OS !== "web" && !request}
        title="Sign in with Google"
        onPress={handleGoogleLogin}
      /> */}
      <ButtonComponent
        title="Forgot password?"
        onPress={() => router.push("/(auth)/resetPassword")}
      />
    </ContainerComponent>
  );
}
