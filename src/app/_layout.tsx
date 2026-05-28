import { Stack } from "expo-router";
import { useEffect } from "react";
import { TeamProvider } from "../../context/TeamContext";
import { AccessibilityProvider } from "../../context/AccessibilityContext";
import { startBatteryWarningService } from "../services/batteryService";
import { registerBackgroundResultSync } from "../services/backgroundSyncService";
import { startUpcomingChallengeListener } from "../services/upcomingChallengeListenerService";
import { StatusBar } from "expo-status-bar";
import { initDatabase } from "../services/resultStorageService";
import * as Location from "expo-location";

useEffect(() => {
  initDatabase();
  registerBackgroundResultSync().catch(console.error);
}, []);

useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Location permission denied");
    }
  })();
}, []);

export default function RootLayout() {
  useEffect(() => {
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

  // Switch order - (tabs) login for development

  return (
  <TeamProvider>
    <AccessibilityProvider>
      <StatusBar hidden={true} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AccessibilityProvider>
  </TeamProvider>
);
}
