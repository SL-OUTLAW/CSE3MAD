import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_SESSION_KEY = "offlineUserSession";

export type OfflineUserSession = {
  uid: string;
  email: string | null;
  teamId?: string;
  teamName?: string;
  grade?: string;
  teamMembers?: string[];
  savedAt: string;
};

export async function saveUserSession(session: OfflineUserSession) {
  await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));

  console.log("[Offline Session] Saved user session:", {
    uid: session.uid,
    email: session.email,
    teamId: session.teamId,
    teamName: session.teamName,
    grade: session.grade,
    teamMembers: session.teamMembers,
    savedAt: session.savedAt,
  });
}

export async function getUserSession() {
  const storedSession = await AsyncStorage.getItem(USER_SESSION_KEY);

  if (!storedSession) {
    console.log("[Offline Session] No saved session found.");
    return null;
  }

  try {
    const session = JSON.parse(storedSession) as OfflineUserSession;

    console.log("[Offline Session] Loaded saved session:", {
      uid: session.uid,
      email: session.email,
      teamId: session.teamId,
      teamName: session.teamName,
      grade: session.grade,
      teamMembers: session.teamMembers,
      savedAt: session.savedAt,
    });

    return session;
  } catch {
    console.log("[Offline Session] Saved session was invalid. Clearing it.");
    await clearUserSession();
    return null;
  }
}

export async function clearUserSession() {
  await AsyncStorage.removeItem(USER_SESSION_KEY);

  console.log("[Offline Session] Cleared saved session.");
}