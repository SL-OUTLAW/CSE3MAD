import { useRouter, useLocalSearchParams } from "expo-router";
import { useTeam } from "../../../context/TeamContext";
import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import {
  loadDraft,
  clearDraft,
  saveResultOffline,
  syncPendingResultsToFirebase,
} from "../../services/resultStorageService";
import HumanPerformanceLabScreen from "../../screens/HumanPerformance";
import * as Location from "expo-location";

export default function HumanPerformanceRoute() {
  const router = useRouter();
  const { activityId, activityTitle } = useLocalSearchParams<{
    activityId: string;
    activityTitle: string;
  }>();
  const { teamId } = useTeam();
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (!teamId || !activityId) return;
    loadDraft(teamId, activityId).then((draft) => setHasDraft(!!draft));
  }, [teamId, activityId]);

  const handleLogResults = () => {
    router.push({
      pathname: "/results",
      params: { activityId, activityTitle },
    });
  };

  const handleFinalSubmit = async () => {
    if (!teamId || !activityId) return;
    const draft = await loadDraft(teamId, activityId);
    if (!draft) {
      Alert.alert("No draft", "Please log results first.");
      return;
    }
    if (!draft.resultText.trim()) {
      Alert.alert("Missing result", "Draft has no result text.");
      return;
    }

    // Get location before saving
    let latitude: number | null = null;
    let longitude: number | null = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      } else {
        console.warn("Location permission denied");
      }
    } catch (error) {
      console.error("Location error:", error);
    }

    try {
      await saveResultOffline({
        teamId,
        activityId,
        activityTitle,
        resultText: draft.resultText,
        rating: draft.rating,
        comment: draft.comment,
        attachments: draft.attachments,
        latitude,
        longitude,
      });
      await clearDraft(teamId, activityId);
      setHasDraft(false);
      syncPendingResultsToFirebase().catch(console.warn);
      Alert.alert("Success", "Result submitted successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not submit result.");
    }
  };

  const handleQuit = async () => {
    if (teamId && activityId) {
      await clearDraft(teamId, activityId);
    }
    router.back();
  };

  return (
    <HumanPerformanceLabScreen
      onBack={handleQuit}
      onLogResults={handleLogResults}
      onSubmit={handleFinalSubmit}
      hasDraft={hasDraft}
    />
  );
}
