import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { UserProfile } from "@/types/types";

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
