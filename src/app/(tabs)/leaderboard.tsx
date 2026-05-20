import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_TEAMS = [
  { rank: 1, name: "Team Alpha", points: 120 },
  { rank: 2, name: "Team Beta", points: 95 },
  { rank: 3, name: "Team Gamma", points: 80 },
  { rank: 4, name: "Team Delta", points: 65 },
  { rank: 5, name: "Team Epsilon", points: 50 },
  { rank: 6, name: "Team Zeta", points: 35 },
];

export default function LeaderboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Leaderboard</Text>

        {MOCK_TEAMS.map((team) => (
          <View
            key={team.rank}
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
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamPoints}>{team.points} points</Text>
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
    marginBottom: 16,
    color: "#0f172a",
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
  teamPoints: {
    fontSize: 14,
    color: "#64748b",
  },
});
