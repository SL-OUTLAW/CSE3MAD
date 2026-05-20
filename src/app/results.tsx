import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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

import { db } from "../services/firebase";
import { useTeam } from "../../context/TeamContext";

export default function ResultsScreen() {
  const router = useRouter();
  const { activityId, activityTitle } = useLocalSearchParams<{
    activityId: string;
    activityTitle: string;
  }>();
  const { teamId } = useTeam();

  const [measuredValue, setMeasuredValue] = useState("");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (!measuredValue.trim()) {
      Alert.alert("Missing value", "Please enter a measured value.");
      return;
    }

    try {
      await addDoc(collection(db, "results"), {
        teamId,
        activityId,
        activityTitle,
        measuredValue: measuredValue.trim(),
        rating: rating.trim(),
        comment: comment.trim(),
        submittedAt: serverTimestamp(),
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
