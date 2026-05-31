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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useTeam } from "../../context/TeamContext";
import { db, loginWithEmail } from "../services/firebase";
import { saveUserSession } from "../services/userSessionService";
import SideQuestLogo from "../components/SideQuestLogo";

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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandSection}>
            <SideQuestLogo size={175} />

            <Text style={styles.appTitle}>
              Side<Text style={styles.appTitleAccent}>Quest</Text>
            </Text>
            <Text style={styles.appSubtitle}>Real-World STEMM Games</Text>
            <Text style={styles.appTagline}>Learn. Explore. Compete.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back!</Text>
            <Text style={styles.formSubtitle}>Login to your team</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#a1a1aa"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#a1a1aa"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <Text style={styles.dividerText}>or</Text>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.secondaryButtonText}>
                Create / Register Team
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f5ff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    justifyContent: "center",
  },

  brandSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#18181b",
    letterSpacing: -1,
    marginTop: -8,
  },
  appTitleAccent: {
    color: "#7c3aed",
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#27272a",
    marginTop: 8,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: "700",
    color: "#71717a",
    marginTop: 6,
  },

  formCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "#ede9fe",
    shadowColor: "#312e81",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#18181b",
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#71717a",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "900",
    color: "#3f3f46",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 16,
    borderRadius: 18,
    fontSize: 16,
    color: "#18181b",
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#6d28d9",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButtonText: {
    color: "#6d28d9",
    fontSize: 16,
    fontWeight: "900",
  },
  dividerText: {
    textAlign: "center",
    color: "#71717a",
    fontSize: 14,
    fontWeight: "800",
    marginVertical: 12,
  },
});
