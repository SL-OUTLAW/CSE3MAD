import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";

import { TeamProvider, useTeam } from "../../context/TeamContext";
import { AccessibilityProvider } from "../../context/AccessibilityContext";
import { startBatteryWarningService } from "../services/batteryService";
import { registerBackgroundResultSync } from "../services/backgroundSyncService";
import { startUpcomingChallengeListener } from "../services/upcomingChallengeListenerService";
import { initDatabase } from "../services/resultStorageService";
import { getUserSession } from "../services/userSessionService";

function SessionGate() {
  const router = useRouter();
  const { setTeamId, setTeamName, setGrade, setTeamMembers } = useTeam();

  useEffect(() => {
    const loadSession = async () => {
      const savedSession = await getUserSession();

      if (!savedSession) {
        router.replace("/login");
        return;
      }

      setTeamId(savedSession.teamId ?? "");
      setTeamName(savedSession.teamName ?? "");
      setGrade(savedSession.grade ?? "");
      setTeamMembers(savedSession.teamMembers ?? []);

      router.replace("/(tabs)/home");
    };

    void loadSession();
  }, [router, setTeamId, setTeamName, setGrade, setTeamMembers]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
    void registerBackgroundResultSync();

    let batterySubscription: { remove: () => void } | undefined;
    const upcomingChallengeUnsubscribe = startUpcomingChallengeListener();

    startBatteryWarningService().then((subscription) => {
      batterySubscription = subscription;
    });

    return () => {
      batterySubscription?.remove();
      upcomingChallengeUnsubscribe();
    };
  }, []);

  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.warn("Location permission denied");
      }
    };

    void requestLocationPermission();
  }, []);

  return (
    <TeamProvider>
      <AccessibilityProvider>
        <StatusBar hidden={true} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <SessionGate />
      </AccessibilityProvider>
    </TeamProvider>
  );
}