import { Stack } from "expo-router";
import { useEffect } from "react";
import { TeamProvider } from "../../context/TeamContext";
import { startBatteryWarningService } from "../services/batteryService";
import {
  addNotificationHandlers,
  registerForPushNotifications,
} from "../services/notificationService";

export default function RootLayout() {
  useEffect(() => {
    void registerForPushNotifications();

    const removeNotificationHandlers = addNotificationHandlers(
      (notification) => {
        console.log("Notification received:", notification.request.content.title);
      },
      (response) => {
        console.log(
          "Notification response:",
          response.notification.request.content.title
        );
      }
    );

    let batterySubscription: { remove: () => void } | undefined;

    startBatteryWarningService().then((subscription) => {
      batterySubscription = subscription;
    });

    return () => {
      removeNotificationHandlers();
      batterySubscription?.remove();
    };
  }, []);

  return (
    <TeamProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
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