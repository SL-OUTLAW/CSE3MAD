import { useLocalSearchParams, useRouter } from "expo-router";
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
import { syncResult } from "../services/resultSyncService";

import { useTeam } from "../../context/TeamContext";

export default function ResultsScreen() {
const router = useRouter();
const params = useLocalSearchParams();
const { teamId } = useTeam();

const getParam = (key: string) => {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
};

const activityId = getParam("activityId");
const activityTitle = getParam("activityTitle");

  const [measuredValue, setMeasuredValue] = useState(getParam("defaultMeasuredValue"));
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (!measuredValue.trim()) {
      Alert.alert("Missing value", "Please enter a measured value.");
      return;
    }

    try {
      const numericValue = Number(measuredValue);
const numericRating = Number(rating);

const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
const safeRating = Number.isFinite(numericRating) ? numericRating : 0;

const calculatedScore = Math.min(100, Math.round(safeValue + safeRating * 10));

const performanceLevel =
  calculatedScore >= 80
    ? "Excellent"
    : calculatedScore >= 50
      ? "Good"
      : "Needs improvement";

const feedback =
  activityId === "A1"
    ? "Parachute result saved with fall time, force, drag, and g-force calculations."
    : activityId === "A2"
      ? "Sound result saved with microphone dB, peak dB, and risk level."
      : activityId === "A3"
        ? "Hand fan result saved with bend angle, material stiffness, and force estimate."
        : "Result saved.";

const calculationData: Record<string, string | number | boolean> =
  activityId === "A1"
    ? {
        attempt: getParam("attempt"),
        dropHeightM: getParam("dropHeightM"),
        toyMassKg: getParam("toyMassKg"),
        designNotes: getParam("designNotes"),
        fallTimeSeconds: getParam("fallTimeSeconds"),
        stopTimeSeconds: getParam("stopTimeSeconds"),
        finalVelocityMs: getParam("finalVelocityMs"),
        accelerationMs2: getParam("accelerationMs2"),
        weightForceN: getParam("weightForceN"),
        netForceN: getParam("netForceN"),
        dragForceN: getParam("dragForceN"),
        gForce: getParam("gForce"),
        videoAttached: getParam("videoAttached"),
      }
    : activityId === "A2"
      ? {
          currentDb: getParam("currentDb"),
          peakDb: getParam("peakDb"),
          riskLevel: getParam("riskLevel"),
          soundDescription: getParam("soundDescription"),
        }
      : activityId === "A3"
        ? {
            distanceCm: getParam("distanceCm"),
            material: getParam("material"),
            fanDesign: getParam("fanDesign"),
            prediction: getParam("prediction"),
            bendAngleDeg: getParam("bendAngleDeg"),
            bendAngleRad: getParam("bendAngleRad"),
            stiffnessNPerRad: getParam("stiffnessNPerRad"),
            estimatedForceN: getParam("estimatedForceN"),
            movementLevel: getParam("movementLevel"),
            observation: getParam("observation"),
            videoAttached: getParam("videoAttached"),
          }
        : {};

await syncResult({
  teamId,
  activityId,
  activityTitle,
  measuredValue,
  rating,
  comment,
  calculatedScore,
  performanceLevel,
  feedback,
  calculationData,
});

      Alert.alert("Saved", "Result saved successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save result. Check Firestore.");
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
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Result Entry</Text>
          <Text style={styles.subtitle}>
            {activityTitle || "Selected Activity"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Measured value"
            value={measuredValue}
            onChangeText={setMeasuredValue}
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="Rating 1-5"
            value={rating}
            onChangeText={setRating}
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={[styles.input, styles.commentInput]}
            placeholder="Comment/reflection"
            value={comment}
            onChangeText={setComment}
            multiline
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit Result</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
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
  commentInput: {
    minHeight: 90,
    textAlignVertical: "top",
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
