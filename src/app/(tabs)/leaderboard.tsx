import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTeam } from "../../../context/TeamContext";
import {
  LeaderboardTeam,
  listenToLeaderboard,
} from "../../services/leaderboardService";

export default function LeaderboardScreen() {
  const { teamId, setRank } = useTeam();
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = listenToLeaderboard(
      teamId,
      (leaderboardTeams) => {
        setTeams(leaderboardTeams);
        setErrorMessage("");
        setIsLoading(false);
      },
      (rank) => {
        setRank(rank);
      },
      (message) => {
        setErrorMessage(message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [teamId, setRank]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.bodyText}>
          Team scores update automatically from Firestore.
        </Text>

        {isLoading && (
          <View style={styles.messageCard}>
            <ActivityIndicator />
            <Text style={styles.messageText}>Loading leaderboard...</Text>
          </View>
        )}

        {!isLoading && errorMessage.length > 0 && (
          <View style={styles.messageCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {!isLoading && errorMessage.length === 0 && teams.length === 0 && (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>No teams found yet.</Text>
          </View>
        )}

        {!isLoading &&
          errorMessage.length === 0 &&
          teams.map((team) => (
            <View
              key={team.id}
              style={[styles.row, team.rank === 1 && styles.rowFirst]}
            >
              <View
                style={[
                  styles.rankBadge,
                  team.rank === 1 && styles.rankBadgeFirst,
                ]}
              >
                <Text
                  style={[
                    styles.rankText,
                    team.rank === 1 && styles.rankTextFirst,
                  ]}
                >
                  #{team.rank}
                </Text>
              </View>

              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{team.teamName}</Text>
                <Text style={styles.teamSubText}>Grade: {team.grade}</Text>
                <Text style={styles.teamSubText}>
                  Badges: {team.badgeCount}
                </Text>
              </View>

              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>{team.totalScore}</Text>
                <Text style={styles.scoreLabel}>points</Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    color: "#0f172a",
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    color: "#334155",
  },
  messageCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 8,
    gap: 8,
  },
  messageText: {
    fontSize: 15,
    color: "#334155",
  },
  errorText: {
    fontSize: 15,
    color: "#dc2626",
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 14,
  },
  rowFirst: {
    borderColor: "#2563eb",
    borderWidth: 2,
    backgroundColor: "#eff6ff",
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeFirst: {
    backgroundColor: "#2563eb",
  },
  rankText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
  },
  rankTextFirst: {
    color: "#ffffff",
  },
  teamInfo: { flex: 1 },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  teamSubText: {
    fontSize: 13,
    color: "#64748b",
  },
  scoreBox: {
    alignItems: "flex-end",
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2563eb",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#64748b",
  },
});
