import { useRouter, useFocusEffect } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTeam } from "../../../context/TeamContext";
import { useAccessibility } from "../../../context/AccessibilityContext";
import { listenToTeamRank } from "../../services/leaderboardService";

import {
  listenToUpcomingChallengesForHome,
  UpcomingChallenge,
} from "../../services/upcomingChallengeListenerService";

export default function HomeScreen() {
  const router = useRouter();
  const { teamName, grade, teamId, rank, score, setRank, setScore } = useTeam();
  const { colours, highContrast } = useAccessibility();

  const [isRankLoading, setIsRankLoading] = useState(true);

  
  useEffect(() => {
    if (!teamId) {
      setIsRankLoading(false);
      return;
    }

    setIsRankLoading(true);
    const unsubscribe = listenToTeamRank(
      teamId,
      (newRank, newScore) => {
        setRank(newRank);
        setScore(newScore);
        setIsRankLoading(false);
      },
      (error) => {
        console.warn("Rank listener error:", error);
        setIsRankLoading(false);
      }
    );

    return unsubscribe;
  }, [teamId, setRank, setScore]);

  
  useFocusEffect(
    useCallback(() => {
      
    }, [])
  );

  const [upcomingChallenges, setUpcomingChallenges] = useState<
    UpcomingChallenge[]
  >([]);
  const [upcomingError, setUpcomingError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToUpcomingChallengesForHome(
      (challenges) => {
        setUpcomingChallenges(challenges);
        setUpcomingError("");
      },
      (message) => {
        setUpcomingError(message);
      },
    );

    return unsubscribe;
  }, []);

  const themedCardStyle = [
    styles.card,
    {
      backgroundColor: colours.card,
      borderColor: colours.border,
      borderWidth: highContrast ? 3 : 1,
    },
  ];

  const titleTextStyle = {
    color: colours.text,
    fontSize: 28 * colours.textScale,
  };

  const cardTitleStyle = {
    color: colours.text,
    fontSize: 18 * colours.textScale,
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colours.background }]}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, titleTextStyle]}>Side Quest</Text>

          <Text
            style={[
              styles.smallText,
              { color: colours.subText, fontSize: 13 * colours.textScale },
            ]}
          >
            Team ID: {teamId || "Not saved yet"}
          </Text>

          <View style={themedCardStyle}>
            <View style={styles.cardTextGroup}>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colours.text,
                    fontSize: 24 * colours.textScale,
                    marginBottom: 25,
                  },
                ]}
              >
                {teamName || "Team"}{" "}
                {rank && !isRankLoading
                  ? `#${rank}`
                  : isRankLoading
                  ? "..."
                  : "#unranked"}
              </Text>

              <Text
                style={[
                  styles.cardTitle,
                  { color: colours.text, fontSize: 20 * colours.textScale },
                ]}
              >
                Score : {isRankLoading ? "..." : score} points
              </Text>

              <Text
                style={[
                  styles.cardText,
                  { color: colours.subText, fontSize: 15 * colours.textScale },
                ]}
              >
                Grade : {grade || "Not set"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("../team-profile")}
              activeOpacity={0.5}
              hitSlop={{ top: 55, bottom: 55, left: 0, right: 14 }}
            >
              <AntDesign
                name="right"
                size={24 * colours.textScale}
                color={colours.text}
              />
            </TouchableOpacity>
          </View>


          <View style={[themedCardStyle, styles.upcomingCard]}>
            <View style={styles.cardTextGroup}>
              <Text style={[styles.cardTitle, cardTitleStyle]}>
                Upcoming Challenges
              </Text>

              {upcomingError.length > 0 && (
                <Text
                  style={[
                    styles.cardText,
                    {
                      color: colours.danger,
                      fontSize: 14 * colours.textScale,
                    },
                  ]}
                >
                  {upcomingError}
                </Text>
              )}

              {upcomingError.length === 0 &&
                upcomingChallenges.length === 0 && (
                  <Text
                    style={[
                      styles.cardText,
                      {
                        color: colours.subText,
                        fontSize: 14 * colours.textScale,
                      },
                    ]}
                  >
                    No upcoming challenges yet.
                  </Text>
                )}

              {upcomingChallenges.length > 0 && (
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.upcomingList}
                >
                  {upcomingChallenges.map((challenge) => (
                    <TouchableOpacity
                      key={challenge.id}
                      style={[
                        styles.upcomingItem,
                        {
                          backgroundColor: colours.background,
                          borderColor: colours.border,
                          borderWidth: highContrast ? 3 : 1,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (!challenge.activityId) {
                          return;
                        }

                        router.push({
                          pathname: "../activity/[id]",
                          params: { id: challenge.activityId },
                        });
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.challengeTitle,
                          {
                            color: colours.text,
                            fontSize: 15 * colours.textScale,
                          },
                        ]}
                      >
                        {challenge.title}
                      </Text>

                      <Text
                        numberOfLines={2}
                        style={[
                          styles.challengeMeta,
                          {
                            color: colours.subText,
                            fontSize: 12 * colours.textScale,
                          },
                        ]}
                      >
                        {challenge.description}
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.challengeMeta,
                          {
                            color: colours.primary,
                            fontSize: 12 * colours.textScale,
                          },
                        ]}
                      >
                        {challenge.startTime}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontWeight: "800",
    marginBottom: 12,
  },
  subtitle: {
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 4,
  },
  smallText: {
    lineHeight: 18,
    marginBottom: 1,
  },
  card: {
    width: "100%",
    height: 145,
    padding: 16,
    paddingTop: 14,
    borderRadius: 14,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingCard: {
    height: 500,
    marginBottom: 0,
    alignItems: "flex-start",
  },
  cardTitle: {
    fontWeight: "800",
    marginBottom: 12,
  },
  cardText: {
    lineHeight: 21,
    marginBottom: 3,
  },
  cardTextGroup: {
    flexDirection: "column",
    flex: 1,
  },
  upcomingList: {
    gap: 10,
    paddingBottom: 4,
  },
  upcomingItem: {
    width: "100%",
    borderRadius: 12,
    padding: 12,
  },
  challengeTitle: {
    fontWeight: "800",
    marginBottom: 4,
  },
  challengeMeta: {
    lineHeight: 17,
  },
});