import { Stack } from "expo-router";
import { TeamProvider } from "../../context/TeamContext";

export default function RootLayout() {
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
