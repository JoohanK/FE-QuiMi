import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Button, StyleSheet } from "react-native";
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
import { profileFromId } from "@/utils/profileFromId";
import TitleComponent from "./TitleComponent";
import ContainerComponent from "./ContainerComponent";
import { UserProfile } from "@/types/types";

interface FriendRequest {
  id: string;
  userId1: string;
  userId2: string;
  status: "pending" | "accepted";
  createdAt: any;
  isSentByMe?: boolean;
}

const FriendRequests = () => {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [profiles, setProfiles] = useState<{ [userId: string]: UserProfile }>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeIncoming = () => {};
    let unsubscribeOutgoing = () => {};

    const setupListeners = async () => {
      if (!auth.currentUser) {
        setFriendRequests([]);
        setProfiles({});
        setLoading(false);
        return;
      }

      const friendRequestsRef = collection(db, "friends");
      const incomingQuery = query(
        friendRequestsRef,
        where("userId2", "==", auth.currentUser.uid),
        where("status", "==", "pending")
      );
      const outgoingQuery = query(
        friendRequestsRef,
        where("userId1", "==", auth.currentUser.uid),
        where("status", "==", "pending")
      );

      unsubscribeIncoming = onSnapshot(
        incomingQuery,
        (incomingSnapshot) => {
          const incomingRequests = incomingSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isSentByMe: false,
          })) as FriendRequest[];

          unsubscribeOutgoing = onSnapshot(
            outgoingQuery,
            async (outgoingSnapshot) => {
              const outgoingRequests = outgoingSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                isSentByMe: true,
              })) as FriendRequest[];

              const allRequests = [...incomingRequests, ...outgoingRequests];
              const uniqueRequests = Array.from(
                new Map(allRequests.map((item) => [item.id, item])).values()
              );

              const profilePromises = uniqueRequests.map((request) =>
                profileFromId(
                  request.isSentByMe ? request.userId2 : request.userId1
                )
              );
              const resolvedProfiles = await Promise.all(profilePromises);

              const profilesMap: { [userId: string]: UserProfile } = {};
              uniqueRequests.forEach((request, index) => {
                const profile = resolvedProfiles[index];
                if (profile) {
                  profilesMap[
                    request.isSentByMe ? request.userId2 : request.userId1
                  ] = profile;
                }
              });

              setFriendRequests(uniqueRequests);
              setProfiles(profilesMap);
              setLoading(false);
            },
            (error) => {
              console.error("Error in outgoing snapshot:", error);
              setLoading(false);
            }
          );
        },
        (error) => {
          console.error("Error in incoming snapshot:", error);
          setLoading(false);
        }
      );
    };

    setupListeners();

    // Cleanup-funktion
    return () => {
      unsubscribeOutgoing();
      unsubscribeIncoming();
    };
  }, [auth.currentUser?.uid]);

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
    return <Text>Loading...</Text>;
  }

  if (friendRequests.length === 0) {
    return null;
  }

  return (
    <ContainerComponent>
      <TitleComponent>Friend Requests</TitleComponent>
      <FlatList
        style={styles.container}
        data={friendRequests}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View style={styles.profileContainer}>
              <Text style={styles.profileEmoji}>
                {profiles[item.isSentByMe ? item.userId2 : item.userId1]
                  ?.photoURL || ""}
              </Text>
              <Text style={styles.profileName}>
                {profiles[item.isSentByMe ? item.userId2 : item.userId1]
                  ?.displayName || "Loading..."}
              </Text>
              {item.isSentByMe && (
                <Text style={styles.pendingText}> (Pending)</Text>
              )}
            </View>
            {!item.isSentByMe && (
              <View style={styles.buttonContainer}>
                <Button
                  title="❌"
                  onPress={() => rejectFriendRequest(item.id)}
                />
                <Button
                  title="✅"
                  onPress={() => acceptFriendRequest(item.id)}
                />
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {},
  pendingRequestContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemContainer: {
    flexDirection: "row",
    minWidth: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderRadius: 5,
    marginVertical: 5,
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
  pendingText: {
    fontStyle: "italic",
    color: "#666",
    marginLeft: 5,
  },
});

export default FriendRequests;
