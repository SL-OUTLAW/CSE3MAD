import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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

import { db, registerWithEmail } from "../services/firebase";
import { useTeam } from "../../context/TeamContext";

export default function TeamSetupScreen() {
  const router = useRouter();
  const { setTeamName, setGrade, setTeamId } = useTeam();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setLocalTeamName] = useState("");
  const [memberNames, setMemberNames] = useState("");
  const [grade, setLocalGrade] = useState("");

  const createDiscriminator = () =>
    Math.floor(1000 + Math.random() * 9000).toString();

  const handleTeamSetup = async () => {
    if (
      !email.trim() ||
      !password.trim() ||
      !teamName.trim() ||
      !memberNames.trim() ||
      !grade.trim()
    ) {
      Alert.alert(
        "Missing details",
        "Please enter email, password, team name, members, and grade/year.",
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    try {
      const user = await registerWithEmail(email.trim(), password);
      const discriminator = createDiscriminator();

      const docRef = await addDoc(collection(db, "teams"), {
        email: email.trim(),
        teamName: teamName.trim(),
        members: memberNames.split(",").map((name) => name.trim()),
        grade: grade.trim(),
        discriminator,
        userId: user.uid,
        totalScore: 0,
        badges: [],
        createdAt: serverTimestamp(),
      });

      setTeamName(teamName.trim());
      setGrade(grade.trim());
      setTeamId(docRef.id);

      Alert.alert("Team saved", `Team discriminator: ${discriminator}`, [
        { text: "OK", onPress: () => router.replace("../(tabs)/home") },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Firebase error",
        "Could not save team. Check Firebase Authentication and Firestore.",
      );
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
          <Text style={styles.title}>STEMM Lab</Text>
          <Text style={styles.subtitle}>Team Setup</Text>

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

          <TextInput
            style={styles.input}
            placeholder="Enter team name"
            value={teamName}
            onChangeText={setLocalTeamName}
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="Enter member names separated by commas"
            value={memberNames}
            onChangeText={setMemberNames}
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="Enter grade/year level"
            value={grade}
            onChangeText={setLocalGrade}
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTeamSetup}
          >
            <Text style={styles.buttonText}>Create Team</Text>
          </TouchableOpacity>
          <TouchableOpacity
           style={styles.secondaryButton}
           onPress={() => router.push("/login")}
         >
           <Text style={styles.secondaryButtonText}>Already have a team? Login</Text>
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
    marginBottom: 16,
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
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "800",
  },
});