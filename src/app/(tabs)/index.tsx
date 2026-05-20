import { useRouter } from "expo-router";
import React from "react";
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

export default function HomeScreen() {
  const router = useRouter();
  const { teamName, grade, teamId } = useTeam();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>STEMM Lab</Text>
          <Text style={styles.subtitle}>
            Welcome, {teamName || "Team"}
          </Text>
          <Text style={styles.bodyText}>
            Grade/Year: {grade || "Not set"}
          </Text>
          <Text style={styles.smallText}>
            Team ID: {teamId || "Not saved yet"}
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Team Progress</Text>
            <Text style={styles.cardText}>Score: 0 points</Text>
            <Text style={styles.cardText}>Completed activities: 0 / 7</Text>
            <Text style={styles.cardText}>Badges: 0</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("../(tabs)/activities")}
          >
            <Text style={styles.buttonText}>View Activities</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("../(tabs)/leaderboard")}
          >
            <Text style={styles.secondaryButtonText}>Leaderboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("../team-setup")}
          >
            <Text style={styles.secondaryButtonText}>Edit Team Setup</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
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
    marginBottom: 12,
    color: "#64748b",
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    color: "#0f172a",
  },
  cardText: { fontSize: 15, lineHeight: 21, color: "#1f2937" },
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