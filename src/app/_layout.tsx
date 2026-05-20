import { Stack } from "expo-router";
import { TeamProvider } from "../../context/TeamContext";

export default function RootLayout() {
  return (
    <TeamProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="team-setup" options={{ headerShown: false }} />
        <Stack.Screen name="activity/[id]" options={{ headerShown: false }} />
      </Stack>
    </TeamProvider>
  );
}