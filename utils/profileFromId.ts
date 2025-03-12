// utils/profileFromId.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export interface UserProfile {
  displayName: string;
  photoURL: string;
}

export const profileFromId = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};
