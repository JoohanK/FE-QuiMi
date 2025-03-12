// components/FriendList.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { profileFromId, UserProfile } from "@/utils/profileFromId";

interface Friend {
  id: string;
  userId1: string;
  userId2: string;
  status: "accepted";
}

const FriendList = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [profiles, setProfiles] = useState<{ [userId: string]: UserProfile }>(
    {}
  );

  const deleteFriend = async (friendId: string) => {
    try {
      const friendDocRef = doc(db, "friends", friendId);
      await deleteDoc(friendDocRef);
    } catch (error) {
      console.error("Error deleting friend:", error);
    }
  };

  useEffect(() => {
    const friendsRef = collection(db, "friends");
    const q = query(
      friendsRef,
      where("status", "==", "accepted"),
      where("userId1", "==", auth.currentUser?.uid)
    );

    const q2 = query(
      friendsRef,
      where("status", "==", "accepted"),
      where("userId2", "==", auth.currentUser?.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const requests: Friend[] = [];
      const profilePromises: Promise<UserProfile | null>[] = []; // Definiera typen här

      querySnapshot.forEach((doc) => {
        const request = { id: doc.id, ...doc.data() } as Friend;
        requests.push(request);

        const friendId =
          request.userId1 === auth.currentUser?.uid
            ? request.userId2
            : request.userId1;
        profilePromises.push(profileFromId(friendId));
      });

      const resolvedProfiles = await Promise.all(profilePromises);

      const profilesMap: { [userId: string]: UserProfile } = {};
      resolvedProfiles.forEach((profile, index) => {
        if (profile) {
          const friendId =
            requests[index].userId1 === auth.currentUser?.uid
              ? requests[index].userId2
              : requests[index].userId1;
          profilesMap[friendId] = profile;
        }
      });

      setFriends(requests);
      setProfiles(profilesMap);
    });

    const unsubscribe2 = onSnapshot(q2, async (querySnapshot) => {
      const requests: Friend[] = [];
      const profilePromises: Promise<UserProfile | null>[] = []; // Definiera typen här

      querySnapshot.forEach((doc) => {
        const request = { id: doc.id, ...doc.data() } as Friend;
        requests.push(request);

        const friendId =
          request.userId1 === auth.currentUser?.uid
            ? request.userId2
            : request.userId1;
        profilePromises.push(profileFromId(friendId));
      });

      const resolvedProfiles = await Promise.all(profilePromises);

      const profilesMap: { [userId: string]: UserProfile } = {};
      resolvedProfiles.forEach((profile, index) => {
        if (profile) {
          const friendId =
            requests[index].userId1 === auth.currentUser?.uid
              ? requests[index].userId2
              : requests[index].userId1;
          profilesMap[friendId] = profile;
        }
      });

      setFriends(requests);
      setProfiles(profilesMap);
    });

    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, []);

  return (
    <View>
      <FlatList
        style={styles.container}
        data={friends}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View style={styles.profileContainer}>
              <Text style={styles.profileEmoji}>
                {profiles[
                  item.userId1 === auth.currentUser?.uid
                    ? item.userId2
                    : item.userId1
                ]?.photoURL || ""}
              </Text>
              <Text style={styles.profileName}>
                {profiles[
                  item.userId1 === auth.currentUser?.uid
                    ? item.userId2
                    : item.userId1
                ]?.displayName || "Loading..."}
              </Text>
            </View>
            <Pressable
              style={styles.deleteButton}
              onPress={() => deleteFriend(item.id)}
            >
              <Text style={styles.deleteButtonText}>X</Text>
            </Pressable>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: Dimensions.get("window").height * 0.4,
    width: Dimensions.get("window").width * 0.8,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileEmoji: {
    fontSize: 30,
    marginRight: 10,
  },
  profileName: {},
  deleteButton: {
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "red",
    fontWeight: "bold",
  },
});

export default FriendList;
