import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAccessibility } from "../../../context/AccessibilityContext";
import { useTeam } from "../../../context/TeamContext";
import { activities } from "../../data/activities";
import {
  clearDraft,
  loadDraft,
  saveResultOffline,
  syncPendingResultsToFirebase,
} from "../../services/resultStorageService";

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { teamId } = useTeam();
  const { colours, highContrast } = useAccessibility();
  const [hasDraft, setHasDraft] = useState(false);

  const activity = activities.find((a) => a.id === id);

  useEffect(() => {
    if (!teamId || !id) return;

    loadDraft(teamId, id).then((draft) => {
      console.log(`[ActivityDetail] Draft exists: ${!!draft}`);
      setHasDraft(!!draft);
    });
  }, [teamId, id]);

  const handleFinalSubmit = async () => {
    if (!teamId || !id) return;

    const draft = await loadDraft(teamId, id);
    if (!draft) {
      Alert.alert("No draft", "Please enter a result first using 'Enter Results'.");
      return;
    }

    if (!draft.resultText.trim()) {
      Alert.alert("Missing result", "Draft has no result text.");
      return;
    }

    try {
      await saveResultOffline({
        teamId,
        activityId: id,
        activityTitle: activity?.title || "Unknown Activity",
        resultText: draft.resultText,
        rating: draft.rating,
        comment: draft.comment,
        attachments: draft.attachments,
      });

      await clearDraft(teamId, id);
      setHasDraft(false);

      syncPendingResultsToFirebase().catch((err) =>
        console.warn("Background sync error", err),
      );

      Alert.alert("Success", "Result submitted successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not submit result.");
    }
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colours.card,
      borderColor: colours.border,
      borderWidth: highContrast ? 3 : 1,
    },
  ];

  const primaryButtonStyle = [
    styles.primaryButton,
    { backgroundColor: colours.primary },
  ];

  const secondaryButtonStyle = [
    styles.secondaryButton,
    {
      backgroundColor: colours.card,
      borderColor: colours.primary,
      borderWidth: highContrast ? 3 : 1,
    },
  ];

  if (!activity) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colours.background }]}
      >
        <View style={styles.scrollContent}>
          <Text
            style={[
              styles.title,
              { color: colours.text, fontSize: 28 * colours.textScale },
            ]}
          >
            Activity not found
          </Text>

          <TouchableOpacity
            style={secondaryButtonStyle}
            onPress={() => router.back()}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: colours.primary, fontSize: 16 * colours.textScale },
              ]}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colours.background }]}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView style={styles.keyboardView} behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text
              style={[
                styles.backText,
                { color: colours.primary, fontSize: 18 * colours.textScale },
              ]}
            >
              ‹ Activities
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.title,
              { color: colours.text, fontSize: 28 * colours.textScale },
            ]}
          >
            {activity.title}
          </Text>

          <Text
            style={[
              styles.category,
              { color: colours.primary, fontSize: 14 * colours.textScale },
            ]}
          >
            {activity.category}
          </Text>

          <Text
            style={[
              styles.bodyText,
              { color: colours.subText, fontSize: 16 * colours.textScale },
            ]}
          >
            {activity.description}
          </Text>

          {"equipment" in activity && activity.equipment && (
            <View style={cardStyle}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: colours.text, fontSize: 18 * colours.textScale },
                ]}
              >
                Equipment
              </Text>

              {activity.equipment.map((item) => (
                <Text
                  key={item}
                  style={[
                    styles.cardText,
                    { color: colours.subText, fontSize: 15 * colours.textScale },
                  ]}
                >
                  • {item}
                </Text>
              ))}
            </View>
          )}

          {"instructions" in activity && activity.instructions && (
            <View style={cardStyle}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: colours.text, fontSize: 18 * colours.textScale },
                ]}
              >
                Instructions
              </Text>

              {activity.instructions.map((step, index) => (
                <Text
                  key={step}
                  style={[
                    styles.cardText,
                    { color: colours.subText, fontSize: 15 * colours.textScale },
                  ]}
                >
                  {index + 1}. {step}
                </Text>
              ))}
            </View>
          )}

          {activity.id === "A1" && (
            <TouchableOpacity
              style={primaryButtonStyle}
              onPress={() => router.push("/activity-screens/parachute-tilt")}
            >
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: 16 * colours.textScale },
                ]}
              >
                Open Tilt Detector
              </Text>
            </TouchableOpacity>
          )}

          {activity.id === "A4" && (
            <TouchableOpacity
              style={primaryButtonStyle}
              onPress={() =>
                router.push({
                  pathname: "../activity-screens/earthquake-vibration",
                  params: {
                    activityId: activity.id,
                    activityTitle: activity.title,
                  },
                })
              }
            >
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: 16 * colours.textScale },
                ]}
              >
                Start Activity
              </Text>
            </TouchableOpacity>
          )}

          {activity.id === "A5" && (
            <TouchableOpacity
              style={primaryButtonStyle}
              onPress={() =>
                router.push({
                  pathname: "../activity-screens/human-performance",
                  params: {
                    activityId: activity.id,
                    activityTitle: activity.title,
                  },
                })
              }
            >
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: 16 * colours.textScale },
                ]}
              >
                Start Activity
              </Text>
            </TouchableOpacity>
          )}

          {activity.id === "A6" && (
            <TouchableOpacity
              style={primaryButtonStyle}
              onPress={() =>
                router.push({
                  pathname: "../activity-screens/reaction-board",
                  params: {
                    activityId: activity.id,
                    activityTitle: activity.title,
                  },
                })
              }
            >
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: 16 * colours.textScale },
                ]}
              >
                Start Activity
              </Text>
            </TouchableOpacity>
          )}

          {activity.id === "A7" && (
            <TouchableOpacity
              style={primaryButtonStyle}
              onPress={() =>
                router.push({
                  pathname: "../activity-screens/breathing-pace",
                  params: {
                    activityId: activity.id,
                    activityTitle: activity.title,
                  },
                })
              }
            >
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: 16 * colours.textScale },
                ]}
              >
                Start Activity
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={secondaryButtonStyle}
            onPress={() => router.back()}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: colours.primary, fontSize: 16 * colours.textScale },
              ]}
            >
              Back to Activities
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontWeight: "600",
  },
  title: {
    fontWeight: "800",
    marginBottom: 8,
  },
  category: {
    fontWeight: "700",
    marginBottom: 12,
  },
  bodyText: {
    lineHeight: 22,
    marginBottom: 12,
  },
  card: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    marginVertical: 8,
  },
  cardTitle: {
    fontWeight: "800",
    marginBottom: 6,
  },
  cardText: {
    lineHeight: 21,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  secondaryButtonText: {
    fontWeight: "800",
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
});