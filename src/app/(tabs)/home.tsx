import { useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTeam } from "../../../context/TeamContext";

export default function HomeScreen() {
  const router = useRouter();
  const { teamName, grade, teamId, rank, score } = useTeam();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Side Quest</Text>
          <Text style={styles.subtitle}>Welcome,</Text>
          <Text style={styles.smallText}>
            Team ID: {teamId || "Not saved yet"}
          </Text>

          <View style={styles.card}>
            <View style={styles.cardTextGroup}>
              <Text
                style={[styles.cardTitle, { fontSize: 24, marginBottom: 25 }]}
              >
                {teamName || "Team"} {rank ? `#${rank}` : "#unranked"}
              </Text>
              <Text style={[styles.cardTitle, { fontSize: 20 }]}>
                Score : {score} points
              </Text>
              <Text style={styles.cardText}>Grade : {grade}</Text>
            </View>
          </View>

          <View style={[styles.card, { alignItems: "flex-start" }]}>
            <View style={styles.cardTextGroup}>
              <Text style={styles.cardTitle}>Recent</Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                height: 312,
                marginBottom: 0,
                alignItems: "flex-start",
              },
            ]}
          >
            <View style={styles.cardTextGroup}>
              <Text style={styles.cardTitle}>Upcoming challenges</Text>
            </View>
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 4,
    color: "#1e293b",
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    color: "#334155",
  },
  smallText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 1,
    color: "#64748b",
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    height: 145,
    padding: 16,
    paddingTop: 14,
    borderRadius: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#0f172a",
  },
  cardText: {
    fontSize: 15,
    lineHeight: 21,
    color: "#1f2937",
    marginBottom: 3,
  },
  cardTextGroup: {
    flexDirection: "column",
    flex: 1,
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
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  secondaryButtonText: { color: "#2563eb", fontSize: 16, fontWeight: "800" },
});
