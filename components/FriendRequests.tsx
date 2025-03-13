import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { profileFromId, UserProfile } from "@/utils/profileFromId";
import TitleComponent from "./TitleComponent";
import ContainerComponent from "./ContainerComponent";

interface FriendRequest {
  id: string;
  userId1: string;
  userId2: string;
  status: "pending" | "accepted";
  createdAt: any;
}

const FriendRequests = () => {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [profiles, setProfiles] = useState<{ [userId: string]: UserProfile }>(
    {}
  );
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    const friendRequestsRef = collection(db, "friends");
    const q = query(
      friendRequestsRef,
      where("userId2", "==", auth.currentUser?.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const requests: FriendRequest[] = [];
      const profilePromises: Promise<UserProfile | null>[] = [];

      querySnapshot.forEach((doc) => {
        const request = { id: doc.id, ...doc.data() } as FriendRequest;
        requests.push(request);

        profilePromises.push(profileFromId(request.userId1));
      });

      const resolvedProfiles = await Promise.all(profilePromises);

      const profilesMap: { [userId: string]: UserProfile } = {};
      resolvedProfiles.forEach((profile, index) => {
        if (profile) {
          profilesMap[requests[index].userId1] = profile;
        }
      });

      setFriendRequests(requests);
      setProfiles(profilesMap);
      setLoading(false); // Set loading to false once data is loaded
    });

    return () => unsubscribe();
  }, []);

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const requestRef = doc(db, "friends", requestId);
      await updateDoc(requestRef, { status: "accepted" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const requestRef = doc(db, "friends", requestId);
      await deleteDoc(requestRef);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>; // Or a loading indicator
  }

  if (friendRequests.length === 0) {
    return null; // Don't render anything if there are no requests
  }

  return (
    <ContainerComponent>
      <TitleComponent>New Friend Requests</TitleComponent>
      <FlatList
        style={styles.container}
        data={friendRequests}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View style={styles.profileContainer}>
              <Text style={styles.profileEmoji}>
                {profiles[item.userId1]?.photoURL || ""}
              </Text>
              <Text style={styles.profileName}>
                {profiles[item.userId1]?.displayName || "Loading..."}
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <Button title="✅" onPress={() => acceptFriendRequest(item.id)} />
              <Button title="❌" onPress={() => rejectFriendRequest(item.id)} />
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {},
  itemContainer: {
    flexDirection: "row",
    minWidth: Dimensions.get("window").width * 0.7,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  profileEmoji: {
    fontSize: 30,
    marginRight: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 5,
  },
  profileName: {},
});

export default FriendRequests;
