import { useRouter } from "expo-router";
import BreathingPaceScreen from "../../screens/BreathingPaceScreen";

export default function BreathingRoute() {
  const router = useRouter();
  return <BreathingPaceScreen onBack={() => router.back()} />;
}