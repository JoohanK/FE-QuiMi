export type RootTabParamList = {
  login: undefined;
  register: undefined;
  resetPassword: undefined;
};

export interface UserProfile {
  userId: string;
  displayName: string;
  photoURL: string;
}

export interface Friend {
  id: string;
  userId1: string;
  userId2: string;
  status: "accepted";
}

export interface FriendWithProfile extends Friend {
  profile: UserProfile | null;
}

export interface Game {
  id: string;
  player1Id: string;
  player2Id: string;
  turn: string;
  matchStatus: string;
  opponentName?: string;
  photoURL?: string;
}
