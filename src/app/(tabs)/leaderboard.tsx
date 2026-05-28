import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAccessibility } from "../../../context/AccessibilityContext";
import { useTeam } from "../../../context/TeamContext";
import {
  LeaderboardTeam,
  listenToLeaderboard,
} from "../../services/leaderboardService";

export default function LeaderboardScreen() {
  const { teamId, setRank, setScore } = useTeam();
  const { colours, highContrast } = useAccessibility();

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

        const currentTeam = leaderboardTeams.find((t) => t.id === teamId);
        if (currentTeam) {
          setScore(currentTeam.totalScore);
        }
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
  }, [teamId, setRank, setScore]);

  const cardStyle = [
    styles.messageCard,
    {
      backgroundColor: colours.card,
      borderColor: colours.border,
      borderWidth: highContrast ? 3 : 1,
    },
  ];

  const textStyle = {
    color: colours.subText,
    fontSize: 15 * colours.textScale,
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colours.background }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text
          style={[
            styles.title,
            { color: colours.text, fontSize: 28 * colours.textScale },
          ]}
        >
          Leaderboard
        </Text>

        <Text
          style={[
            styles.bodyText,
            { color: colours.subText, fontSize: 16 * colours.textScale },
          ]}
        >
          Team scores update automatically from Firestore.
        </Text>

        {isLoading && (
          <View style={cardStyle}>
            <ActivityIndicator color={colours.primary} />
            <Text style={[styles.messageText, textStyle]}>
              Loading leaderboard...
            </Text>
          </View>
        )}

        {!isLoading && errorMessage.length > 0 && (
          <View style={cardStyle}>
            <Text
              style={[
                styles.errorText,
                { color: colours.danger, fontSize: 15 * colours.textScale },
              ]}
            >
              {errorMessage}
            </Text>
          </View>
        )}

        {!isLoading && errorMessage.length === 0 && teams.length === 0 && (
          <View style={cardStyle}>
            <Text style={[styles.messageText, textStyle]}>
              No teams found yet.
            </Text>
          </View>
        )}

        {!isLoading &&
          errorMessage.length === 0 &&
          teams.map((team) => {
            const isFirst = team.rank === 1;

            return (
              <View
                key={team.id}
                style={[
                  styles.row,
                  {
                    backgroundColor: colours.card,
                    borderColor: isFirst ? colours.primary : colours.border,
                    borderWidth: highContrast || isFirst ? 3 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.rankBadge,
                    {
                      backgroundColor: isFirst
                        ? colours.primary
                        : colours.rowBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rankText,
                      {
                        color: isFirst ? "#ffffff" : colours.text,
                        fontSize: 14 * colours.textScale,
                      },
                    ]}
                  >
                    #{team.rank}
                  </Text>
                </View>

                <View style={styles.teamInfo}>
                  <Text
                    style={[
                      styles.teamName,
                      { color: colours.text, fontSize: 16 * colours.textScale },
                    ]}
                  >
                    {team.teamName}
                  </Text>
                  <Text
                    style={[
                      styles.teamSubText,
                      {
                        color: colours.subText,
                        fontSize: 13 * colours.textScale,
                      },
                    ]}
                  >
                    Grade: {team.grade}
                  </Text>
                  <Text
                    style={[
                      styles.teamSubText,
                      {
                        color: colours.subText,
                        fontSize: 13 * colours.textScale,
                      },
                    ]}
                  >
                    Badges: {team.badgeCount}
                  </Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text
                    style={[
                      styles.scoreText,
                      {
                        color: colours.primary,
                        fontSize: 20 * colours.textScale,
                      },
                    ]}
                  >
                    {team.totalScore}
                  </Text>
                  <Text
                    style={[
                      styles.scoreLabel,
                      {
                        color: colours.subText,
                        fontSize: 12 * colours.textScale,
                      },
                    ]}
                  >
                    points
                  </Text>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  title: {
    fontWeight: "800",
    marginBottom: 8,
  },
  bodyText: {
    lineHeight: 22,
    marginBottom: 12,
  },
  messageCard: {
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  messageText: {},
  errorText: {
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginVertical: 6,
    gap: 14,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontWeight: "800",
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontWeight: "700",
    marginBottom: 2,
  },
  teamSubText: {},
  scoreBox: {
    alignItems: "flex-end",
  },
  scoreText: {
    fontWeight: "800",
  },
  scoreLabel: {},
});