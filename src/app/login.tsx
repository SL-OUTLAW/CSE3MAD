import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useTeam } from "../../context/TeamContext";
import { db, loginWithEmail } from "../services/firebase";
import { saveUserSession } from "../services/userSessionService";

export default function LoginScreen() {
  const router = useRouter();

  const { setTeamName, setGrade, setTeamId, setTeamMembers } = useTeam();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Please enter your email and password.");
      return;
    }

    try {
      const user = await loginWithEmail(email.trim(), password);

      const teamQuery = query(
        collection(db, "teams"),
        where("userId", "==", user.uid),
        limit(1),
      );

      const teamSnapshot = await getDocs(teamQuery);

      let savedTeamId = "";
      let savedTeamName = "";
      let savedGrade = "";
      let savedMembers: string[] = [];

      if (!teamSnapshot.empty) {
        const teamDoc = teamSnapshot.docs[0];
        const teamData = teamDoc.data();
        const members = Array.isArray(teamData.members) ? teamData.members : [];

        savedTeamId = teamDoc.id;
        savedTeamName = String(teamData.teamName ?? "");
        savedGrade = String(teamData.grade ?? "");
        savedMembers = members;

        setTeamId(savedTeamId);
        setTeamName(savedTeamName);
        setGrade(savedGrade);
        setTeamMembers(savedMembers);
      }

      await saveUserSession({
        uid: user.uid,
        email: user.email,
        teamId: savedTeamId,
        teamName: savedTeamName,
        grade: savedGrade,
        teamMembers: savedMembers,
        savedAt: new Date().toISOString(),
      });

      Alert.alert("Login successful", "Welcome back.", [
        { text: "OK", onPress: () => router.replace("../(tabs)/home") },
      ]);
    } catch {
      Alert.alert(
        "Login failed",
        "Could not log in. Please check your email and password.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Side Quest</Text>
          <Text style={styles.subtitle}>Login</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.secondaryButtonText}>Create New Team</Text>
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
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 30,
    color: "#1e293b",
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
