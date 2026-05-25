import { Stack } from "expo-router";
import { useEffect } from "react";
import { TeamProvider } from "../../context/TeamContext";
import { startBatteryWarningService } from "../services/batteryService";
import { registerBackgroundResultSync } from "../services/backgroundSyncService";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  useEffect(() => {
    void registerBackgroundResultSync();

    let batterySubscription: { remove: () => void } | undefined;

    startBatteryWarningService().then((subscription) => {
      batterySubscription = subscription;
    });

    return () => {
      batterySubscription?.remove();
    };
  }, []);

  return (
    <TeamProvider>
      <StatusBar hidden={true} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </TeamProvider>
  );
}
