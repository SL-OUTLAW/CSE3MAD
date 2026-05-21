import { useLocalSearchParams, useRouter } from "expo-router";
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

import { activities } from "../../data/activities";

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const activity = activities.find((a) => a.id === id);

  if (!activity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.scrollContent}>
          <Text style={styles.title}>Activity not found</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹ Activities</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.category}>{activity.category}</Text>
          <Text style={styles.bodyText}>{activity.description}</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity Tools</Text>
            {activity.tools.map((tool) => (
              <Text key={tool} style={styles.cardText}>
                • {tool}
              </Text>
            ))}
          </View>

          {"equipment" in activity && activity.equipment && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Equipment</Text>
              {activity.equipment.map((item) => (
                <Text key={item} style={styles.cardText}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          {"instructions" in activity && activity.instructions && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Instructions</Text>
              {activity.instructions.map((step, index) => (
                <Text key={step} style={styles.cardText}>
                  {index + 1}. {step}
                </Text>
              ))}
            </View>
          )}

          {"diagramNotes" in activity && activity.diagramNotes && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Diagram Notes</Text>
              {activity.diagramNotes.map((note) => (
                <Text key={note} style={styles.cardText}>
                  • {note}
                </Text>
              ))}
            </View>
          )}

          {activity.id === "A1" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/activity-screens/parachute-tilt")}
            >
              <Text style={styles.buttonText}>Open Tilt Detector</Text>
            </TouchableOpacity>
          )}

          {activity.id === "A7" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("../activity-screens/breathing-pace")}
            >
              <Text style={styles.buttonText}>Open Breathing Sensor</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: "/results",
                params: {
                  activityId: activity.id,
                  activityTitle: activity.title,
                },
              })
            }
          >
            <Text style={styles.buttonText}>Enter Results</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Back to Activities</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 18,
    color: "#2563eb",
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    color: "#0f172a",
  },
  category: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    color: "#2563eb",
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    color: "#334155",
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