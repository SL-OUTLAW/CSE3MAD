import { useRouter } from "expo-router";
import { useTeam } from "../../../context/TeamContext";
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import SoundPollutionActivity from "../../screens/SoundPollutionActivity";
import {
  clearDraft,
  loadDraft,
  saveResultOffline,
  syncPendingResultsToFirebase,
} from "../../services/resultStorageService";

type SubmitParams = Record<string, string>;

const activityId = "A2";
const activityTitle = "Sound Pollution Hunter";

export default function SoundPollutionRoute() {
  const router = useRouter();
  const { teamId } = useTeam();
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    loadDraft(teamId, activityId).then((draft) => setHasDraft(!!draft));
  }, [teamId]);

  const handleLogResults = (params: SubmitParams = {}) => {
    router.push({
      pathname: "/results",
      params: {
        activityId,
        activityTitle,
        ...params,
      },
    });
  };

  const handleFinalSubmit = async () => {
    if (!teamId) return;

    const draft = await loadDraft(teamId, activityId);
    if (!draft) {
      Alert.alert("No draft", "Please log results first.");
      return;
    }

    if (!draft.resultText.trim()) {
      Alert.alert("Missing result", "Draft has no result text.");
      return;
    }

    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
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
    if (teamId) {
      await clearDraft(teamId, activityId);
    }
    router.back();
  };

  return (
    <SoundPollutionActivity
      onBack={handleQuit}
      onLogResults={handleLogResults}
      onSubmit={handleFinalSubmit}
    />
  );
}