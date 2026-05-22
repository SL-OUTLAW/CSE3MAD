import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "./firebase";

export type LeaderboardTeam = {
  id: string;
  rank: number;
  teamName: string;
  grade: string;
  totalScore: number;
  badgeCount: number;
};

export function listenToLeaderboard(
  teamId: string,
  onUpdate: (teams: LeaderboardTeam[]) => void,
  onRankUpdate: (rank: number | null) => void,
  onError: (message: string) => void,
) {
  const leaderboardQuery = query(
    collection(db, "teams"),
    orderBy("totalScore", "desc"),
    limit(20),
  );

  return onSnapshot(
    leaderboardQuery,
    (snapshot) => {
      let currentTeamRank: number | null = null;

      const teams = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        const calculatedRank = index + 1;

        if (doc.id === teamId) {
          currentTeamRank = calculatedRank;
        }

        return {
          id: doc.id,
          rank: calculatedRank,
          teamName:
            typeof data.teamName === "string" && data.teamName.trim().length > 0
              ? data.teamName
              : "Unnamed Team",
          grade:
            typeof data.grade === "string" && data.grade.trim().length > 0
              ? data.grade
              : "Not set",
          totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
          badgeCount: Array.isArray(data.badges) ? data.badges.length : 0,
        };
      });

      onUpdate(teams);
      onRankUpdate(currentTeamRank);
    },
    (error) => {
      console.error(error);
      onError("Could not load leaderboard.");
    },
  );
}
