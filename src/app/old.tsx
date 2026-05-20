import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { ReactNode, useState } from "react";
import {
  Alert,
  FlatList,
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

import { activities } from "../data/activities";
import BatteryStatusScreen from "../screens/BatteryStatusScreen";
import BreathingPaceScreen from "../screens/BreathingPaceScreen";
import ParachuteTiltScreen from "../screens/ParachuteTiltScreen";
import { db, registerWithEmail } from "../services/firebase";

type ScreenName =
  | "team"
  | "home"
  | "activities"
  | "detail"
  | "results"
  | "leaderboard"
  | "settings"
  | "breathing"
  | "parachuteTilt"
  | "battery";

type Activity = {
  id: string;
  title: string;
  category: string;
  description: string;
  tools: string[];
};

function ScreenWrapper({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  const [screen, setScreen] = useState<ScreenName>("team");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [teamName, setTeamName] = useState("");
  const [memberNames, setMemberNames] = useState("");
  const [grade, setGrade] = useState("");
  const [teamId, setTeamId] = useState("");

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );

  const createDiscriminator = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

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

      setTeamId(docRef.id);
      Alert.alert("Team saved", `Team discriminator: ${discriminator}`);
      setScreen("home");
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Firebase error",
        "Could not save team. Check Firebase Authentication and Firestore.",
      );
    }
  };

  if (screen === "breathing") {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <BreathingPaceScreen onBack={() => setScreen("detail")} />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (screen === "parachuteTilt") {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ParachuteTiltScreen onBack={() => setScreen("detail")} />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (screen === "battery") {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <BatteryStatusScreen onBack={() => setScreen("settings")} />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (screen === "team") {
    return (
      <ScreenWrapper>
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
            onChangeText={setTeamName}
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
            onChangeText={setGrade}
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTeamSetup}
          >
            <Text style={styles.buttonText}>Save Team</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (screen === "home") {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>STEMM Lab</Text>
          <Text style={styles.subtitle}>Welcome, {teamName || "Team"}</Text>
          <Text style={styles.bodyText}>Grade/Year: {grade || "Not set"}</Text>
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
            onPress={() => setScreen("activities")}
          >
            <Text style={styles.buttonText}>View Activities</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScreen("leaderboard")}
          >
            <Text style={styles.secondaryButtonText}>Leaderboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScreen("settings")}
          >
            <Text style={styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (screen === "activities") {
    return (
      <ScreenWrapper>
        <View style={styles.listScreenContent}>
          <Text style={styles.title}>Activity Library</Text>
          <Text style={styles.bodyText}>
            Choose one of the 7 STEMM activities.
          </Text>

          <FlatList
            data={activities}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedActivity(item);
                  setScreen("detail");
                }}
              >
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.cardText}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScreen("home")}
          >
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  if (screen === "detail" && selectedActivity) {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{selectedActivity.title}</Text>
          <Text style={styles.category}>{selectedActivity.category}</Text>
          <Text style={styles.bodyText}>{selectedActivity.description}</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity Tools</Text>
            {selectedActivity.tools.map((tool) => (
              <Text key={tool} style={styles.cardText}>
                • {tool}
              </Text>
            ))}
          </View>

          {selectedActivity.id === "A1" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setScreen("parachuteTilt")}
            >
              <Text style={styles.buttonText}>Open Tilt Detector</Text>
            </TouchableOpacity>
          )}

          {selectedActivity.id === "A7" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setScreen("breathing")}
            >
              <Text style={styles.buttonText}>Open Breathing Sensor</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setScreen("results")}
          >
            <Text style={styles.buttonText}>Enter Results</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScreen("activities")}
          >
            <Text style={styles.secondaryButtonText}>Back to Activities</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (screen === "results") {
    return (
      <ScreenWrapper>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Result Entry</Text>
          <Text style={styles.subtitle}>
            {selectedActivity?.title || "Selected Activity"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Measured value"
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="Rating 1-5"
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={[styles.input, styles.commentInput]}
            placeholder="Comment/reflection"
            multiline
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => Alert.alert("Demo", "Result saved successfully")}
          >
            <Text style={styles.buttonText}>Submit Result</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScreen("home")}
          >
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (screen === "leaderboard") {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Leaderboard</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Team Alpha</Text>
            <Text style={styles.cardText}>120 points</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Team Beta</Text>
            <Text style={styles.cardText}>95 points</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Team Gamma</Text>
            <Text style={styles.cardText}>80 points</Text>
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScreen("home")}
          >
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (screen === "settings") {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Settings</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Accessibility</Text>
            <Text style={styles.cardText}>Large text: Coming soon</Text>
            <Text style={styles.cardText}>Dark mode: Coming soon</Text>
            <Text style={styles.cardText}>Notifications: Coming soon</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setScreen("battery")}
          >
            <Text style={styles.buttonText}>Check Battery Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScreen("home")}
          >
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  listScreenContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  listContent: {
    paddingBottom: 16,
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
  commentInput: {
    minHeight: 90,
    textAlignVertical: "top",
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
  cardText: {
    fontSize: 15,
    lineHeight: 21,
    color: "#1f2937",
  },
  category: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    color: "#2563eb",
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
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "800",
  },
});
