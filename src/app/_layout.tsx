import { Stack } from "expo-router";
import { useEffect } from "react";
import { TeamProvider } from "../../context/TeamContext";
import { startBatteryWarningService } from "../services/batteryService";

export default function RootLayout() {
  useEffect(() => {
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="team-edit" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="activity/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="results" options={{ headerShown: false }} />
        <Stack.Screen
          name="activity-screens/parachute-tilt"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="activity-screens/breathing-pace"
          options={{ headerShown: false }}
        />
      </Stack>
    </TeamProvider>
  );
}