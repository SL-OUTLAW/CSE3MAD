import React, { useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { activities } from "../data/activities";

export default function HomeScreen() {
  const [screen, setScreen] = useState("team");
  const [teamName, setTeamName] = useState("");
  const [grade, setGrade] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  if (screen === "team") {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>STEMM Lab</Text>
        <Text style={styles.subtitle}>Team Setup</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter team name"
          value={teamName}
          onChangeText={setTeamName}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter grade/year level"
          value={grade}
          onChangeText={setGrade}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setScreen("home")}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (screen === "home") {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>STEMM Lab</Text>
        <Text style={styles.subtitle}>Welcome, {teamName || "Team"}</Text>
        <Text style={styles.bodyText}>Grade/Year: {grade || "Not set"}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Team Progress</Text>
          <Text>Score: 0 points</Text>
          <Text>Completed activities: 0 / 7</Text>
          <Text>Badges: 0</Text>
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
      </SafeAreaView>
    );
  }

  if (screen === "activities") {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Activity Library</Text>
        <Text style={styles.bodyText}>Choose one of the 7 STEMM activities.</Text>

        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
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
              <Text>{item.description}</Text>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setScreen("home")}
        >
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (screen === "detail" && selectedActivity) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>{selectedActivity.title}</Text>
          <Text style={styles.category}>{selectedActivity.category}</Text>
          <Text style={styles.bodyText}>{selectedActivity.description}</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity Tools</Text>
            <Text>• Timer</Text>
            <Text>• Result entry</Text>
            <Text>• Video upload placeholder</Text>
            <Text>• GPS/sensor support placeholder</Text>
          </View>

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
      </SafeAreaView>
    );
  }

  if (screen === "results") {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Result Entry</Text>
        <Text style={styles.subtitle}>{selectedActivity?.title}</Text>

        <TextInput style={styles.input} placeholder="Measured value" />
        <TextInput style={styles.input} placeholder="Rating 1-5" />
        <TextInput style={styles.input} placeholder="Comment/reflection" />

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
      </SafeAreaView>
    );
  }

  if (screen === "leaderboard") {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Leaderboard</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Team Alpha</Text>
          <Text>120 points</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Team Beta</Text>
          <Text>95 points</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Team Gamma</Text>
          <Text>80 points</Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setScreen("home")}
        >
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (screen === "settings") {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accessibility</Text>
          <Text>Large text: Coming soon</Text>
          <Text>Dark mode: Coming soon</Text>
          <Text>Notifications: Coming soon</Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setScreen("home")}
        >
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 8,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1e293b",
  },
  bodyText: {
    fontSize: 16,
    marginBottom: 12,
    color: "#334155",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    color: "#0f172a",
  },
  category: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#2563eb",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "700",
  },
});