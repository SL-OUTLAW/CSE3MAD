import { useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useTeam } from "../../context/TeamContext";
import { useAccessibility } from "../../context/AccessibilityContext";

export default function ResultsScreen() {
  const router = useRouter();
  const { teamName, grade, teamId, rank, score, teamMembers } = useTeam();
  const { colours, highContrast } = useAccessibility();
  const normalTextStyle = [
    styles.text,
    { color: colours.text, fontSize: 16 * colours.textScale },
  ];

  const badgesMock = [
    { id: 1, earned: false },
    { id: 2, earned: false },
    { id: 3, earned: true },
    { id: 4, earned: false },
    { id: 5, earned: true },
    { id: 6, earned: false },
    { id: 7, earned: true },
    { id: 8, earned: true },
    { id: 9, earned: true },
    { id: 10, earned: false },
    { id: 11, earned: false },
    { id: 12, earned: true },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colours.background }]} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("../(tabs)/home")}
          >
            <Text style={[styles.backText, { color: colours.primary, fontSize: 18* colours.textScale },
              ]}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colours.text, fontSize: 28 * colours.textScale }]}>
            Team
          </Text>

          <Text style={[normalTextStyle, { marginBottom: 0 }]}>
            Team : {teamName}
          </Text>
          <Text
            style={[
              styles.text,
              { fontSize: 11 * colours.textScale, color: colours.subText, marginBottom: 8 },
            ]}
          >
            Team ID : {teamId}
          </Text>
          <Text style={normalTextStyle}>Grade : {grade}</Text>
          <Text style={normalTextStyle}>Score : {score}</Text>
          <Text style={normalTextStyle}>Rank : {rank}</Text>
          <Text style={normalTextStyle}>
            Members :{" "}
            {teamMembers.length > 0 ? teamMembers.join(", ") : "None listed"}
          </Text>

          <Text style={[styles.title, { color: colours.text, fontSize: 28 * colours.textScale, marginTop: 20 }]}>Badges</Text>

          <View style={styles.gridContainer}>
            {badgesMock.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.squarePlaceholder,
                  badge.earned ? styles.badgeEarned : styles.badgeLocked,
                  {
                    borderWidth: highContrast ? 3 : 1,
                    borderColor: colours.border,
                    backgroundColor: badge.earned ? colours.card : colours.inactiveButton,
                  },
                ]}
              >
                {badge.earned && (
                  <Text style={styles.checkmark}>
                    <Feather
                      name="check"
                      size={24 * colours.textScale}
                      color={colours.success}
                    />
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 18, color: "#2563eb", fontWeight: "600" },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1e293b",
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    color: "#1f2937",
    marginBottom: 3,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2563eb",
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 10,
    marginBottom: 24,
  },

  squarePlaceholder: {
    width: "30%",
    height: "30%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  badgeLocked: {
    backgroundColor: "#e2e8f0",
    borderColor: "#cbd5e1",
  },
  badgeEarned: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },

  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  secondaryButtonText: { color: "#2563eb", fontSize: 16, fontWeight: "800" },
});
