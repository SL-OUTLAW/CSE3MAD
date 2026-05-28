import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTeam } from "../../context/TeamContext";
import { useAccessibility } from "../../context/AccessibilityContext";
import { db } from "../services/firebase";

export default function TeamEditScreen() {
  const router = useRouter();
  const { teamName, grade, teamId, setTeamName, setGrade } = useTeam();
  const { colours, highContrast } = useAccessibility();

  const [localTeamName, setLocalTeamName] = useState(teamName);
  const [localGrade, setLocalGrade] = useState(grade);

  const handleSave = async () => {
    if (!teamId) {
      Alert.alert("No team found", "Please log in or create a team first.");
      return;
    }

    if (!localTeamName.trim() || !localGrade.trim()) {
      Alert.alert("Missing details", "Please enter team name and grade/year.");
      return;
    }

    try {
      await updateDoc(doc(db, "teams", teamId), {
        teamName: localTeamName.trim(),
        grade: localGrade.trim(),
      });

      setTeamName(localTeamName.trim());
      setGrade(localGrade.trim());

      Alert.alert("Team updated", "Your team details have been saved.", [
        { text: "OK", onPress: () => router.replace("../(tabs)/home") },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Update failed",
        "Could not update team details. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colours.background }]} edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backText, { color: colours.primary, fontSize: 18 * colours.textScale },
              ]}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colours.text, fontSize: 28 * colours.textScale }]}>
            Edit Team
          </Text>
          <Text style={[styles.subtitle, { color: colours.text, fontSize: 18 * colours.textScale }]}>
            Update your team details
          </Text>
          <Text style={[styles.label, { color: colours.text, fontSize: 15 * colours.textScale }]}>
            Team ID
          </Text>
          <Text style={[styles.teamIdText, { color: colours.text, fontSize: 14 * colours.textScale }]}>
            {teamId || "Not saved yet"}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colours.card,
                borderColor: colours.border,
                borderWidth: highContrast ? 3 : 1,
                color: colours.text,
                fontSize: 16 * colours.textScale,
              },
            ]}
            placeholder="Enter team name"
            value={localTeamName}
            onChangeText={setLocalTeamName}
            placeholderTextColor={colours.subText}
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colours.card,
                borderColor: colours.border,
                borderWidth: highContrast ? 3 : 1,
                color: colours.text,
                fontSize: 16 * colours.textScale,
              },
            ]}
            placeholder="Enter grade/year level"
            placeholderTextColor={colours.subText}
            value={localGrade}
            onChangeText={setLocalGrade}
          />

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colours.primary }]} onPress={handleSave}>
            <Text style={[styles.buttonText, { fontSize: 16 * colours.textScale }]}>Save Team Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colours.card, borderColor: colours.primary, borderWidth: highContrast ? 3 : 1 }]}
            onPress={() => router.replace("../(tabs)/home")}
          >
            <Text style={[styles.secondaryButtonText, {color: colours.primary, fontSize: 16 * colours.textScale }] }>Cancel</Text>
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
  backButton: { marginBottom: 8 },
  backText: { fontSize: 18, color: "#2563eb", fontWeight: "600" },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1e293b",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
  },
  teamIdText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    borderRadius: 12,
    fontSize: 16,
    color: "#0f172a",
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
