import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTeam } from "../../context/TeamContext";
import { db } from "../services/firebase";

export default function TeamProfileScreen() {
  const router = useRouter();

  const {
    teamName,
    grade,
    teamId,
    rank,
    score,
    teamMembers,
    setTeamName,
    setGrade,
    setTeamMembers,
  } = useTeam();

  const [editedTeamName, setEditedTeamName] = useState(teamName);
  const [editedGrade, setEditedGrade] = useState(grade);
  const [editedMembers, setEditedMembers] = useState<string[]>([
    teamMembers[0] || "",
    teamMembers[1] || "",
    teamMembers[2] || "",
    teamMembers[3] || "",
    teamMembers[4] || "",
  ]);

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

  const updateMember = (index: number, value: string) => {
    const updated = [...editedMembers];
    updated[index] = value;
    setEditedMembers(updated);
  };

  const handleSave = async () => {
    const cleanedTeamName = editedTeamName.trim();
    const cleanedGrade = editedGrade.trim();
    const cleanedMembers = editedMembers
      .map((member) => member.trim())
      .filter((member) => member.length > 0);

    if (!teamId) {
      Alert.alert("Missing Team ID", "Please login or register your team again.");
      return;
    }

    if (!cleanedTeamName) {
      Alert.alert("Missing Team Name", "Please enter a team name.");
      return;
    }

    if (!cleanedGrade) {
      Alert.alert("Missing Grade", "Please enter your grade or year level.");
      return;
    }

    if (cleanedMembers.length === 0) {
      Alert.alert("Missing Team Members", "Please enter at least one team member.");
      return;
    }

    try {
      await updateDoc(doc(db, "teams", teamId), {
        teamName: cleanedTeamName,
        grade: cleanedGrade,
        teamMembers: cleanedMembers,
      });

      setTeamName(cleanedTeamName);
      setGrade(cleanedGrade);
      setTeamMembers(cleanedMembers);

      Alert.alert("Saved", "Team details and members updated successfully.");
    } catch (error) {
      Alert.alert("Save failed", "Could not update team details. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
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
            onPress={() => router.push("../(tabs)/home")}
          >
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Edit Team Profile</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Editing</Text>
            <Text style={styles.helperText}>
              Update your team name, grade/year level, and team member names.
            </Text>

            <Text style={styles.label}>Team ID</Text>
            <Text style={styles.readOnlyValue}>{teamId || "Not available"}</Text>

            <Text style={styles.label}>Team Name</Text>
            <TextInput
              style={styles.input}
              value={editedTeamName}
              onChangeText={setEditedTeamName}
              placeholder="Enter team name"
            />

            <Text style={styles.label}>Grade / Year Level</Text>
            <TextInput
              style={styles.input}
              value={editedGrade}
              onChangeText={setEditedGrade}
              placeholder="Enter grade or year level"
            />

            <Text style={styles.sectionTitle}>Team Members</Text>
            <Text style={styles.helperText}>
              Add the first names of students in this team.
            </Text>

            {editedMembers.map((member, index) => (
              <View key={index}>
                <Text style={styles.label}>Member {index + 1}</Text>
                <TextInput
                  style={styles.input}
                  value={member}
                  onChangeText={(value) => updateMember(index, value)}
                  placeholder={`Enter member ${index + 1} name`}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Save Team Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Current Team Stats</Text>
            <Text style={styles.text}>Score: {score ?? "Not available"}</Text>
            <Text style={styles.text}>Rank: {rank ?? "Not available"}</Text>
          </View>

          <Text style={[styles.title, { marginTop: 20 }]}>Badges</Text>

          <View style={styles.gridContainer}>
            {badgesMock.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.squarePlaceholder,
                  badge.earned ? styles.badgeEarned : styles.badgeLocked,
                ]}
              >
                {badge.earned && <Feather name="check" size={24} color="green" />}
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    color: "#1e293b",
  },
  helperText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 8,
  },
  readOnlyValue: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: "#1f2937",
    marginBottom: 4,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
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
});