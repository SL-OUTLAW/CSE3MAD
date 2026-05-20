import { useRouter } from "expo-router";
import ParachuteTiltScreen from "../../screens/ParachuteTiltScreen";

export default function ParachuteTiltRoute() {
  const router = useRouter();
  return <ParachuteTiltScreen onBack={() => router.back()} />;
}