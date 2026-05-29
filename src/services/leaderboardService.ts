import {
  collection,
  query,
  orderBy,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

export type LeaderboardTeam = {
  id: string;
  teamName: string;
  totalScore: number;
  grade: string;
  badgeCount: number;
  rank: number;
};

export function listenToLeaderboard(
  currentTeamId: string,
  onTeamsUpdate: (teams: LeaderboardTeam[]) => void,
  onRankUpdate: (rank: number) => void,
  onError: (message: string) => void
) {
  const q = query(collection(db, "teams"), orderBy("totalScore", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      let rank = 1;
      const teams: LeaderboardTeam[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        teams.push({
          id: doc.id,
          teamName: data.teamName || "Unnamed",
          totalScore: data.totalScore || 0,
          grade: data.grade || "N/A",
          badgeCount: data.badgeCount || 0,
          rank: rank,
        });

        if (doc.id === currentTeamId) {
          onRankUpdate(rank);
        }
        rank++;
      });

      onTeamsUpdate(teams);
      onError("");
    },
    (error) => {
      console.error("Leaderboard listener error:", error);
      onError("Failed to load leaderboard. Check your network.");
    }
  );

  return unsubscribe;
}

export function listenToTeamRank(
  teamId: string,
  onRankUpdate: (rank: number, score: number) => void,
  onError: (error: string) => void
) {
  if (!teamId) {
    onError("No team ID provided");
    return () => {};
  }

  const q = query(collection(db, "teams"), orderBy("totalScore", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      let rank = 1;
      let found = false;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (doc.id === teamId) {
          const score = data.totalScore || 0;
          onRankUpdate(rank, score);
          found = true;
          onError("");
          break;
        }
        rank++;
      }

      if (!found) {
        onError("Team not found in leaderboard.");
      }
    },
    (error) => {
      console.error("Team rank listener error:", error);
      onError("Failed to fetch rank.");
    }
  );

  return unsubscribe;
}